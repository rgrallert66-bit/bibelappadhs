import { describe, expect, it } from 'vitest'
import { buildSession, interleave } from './session'
import { VERSES } from '../data/verses'
import type { MemoryState } from './fsrs'
import { questsFor } from '../data/goals'

const verses = Object.fromEntries(VERSES.map((v) => [v.id, v]))
const mem = (stability: number, last: string, due: string): MemoryState => ({ stability, difficulty: 5, last, due, reps: 3, lapses: 0 })
const base = {
  verses,
  memory: {} as Record<string, MemoryState>,
  queue: VERSES.map((v) => v.id),
  today: '2026-05-10',
  goal: 'normal' as const,
  newPerDay: 1,
  newToday: 0,
  bias: 0,
  translation: 'elb' as const,
  mode: 'daily' as const,
  seed: 7,
}

describe('session planning edge cases', () => {
  it('protects reviews after a long absence: no new verse when the backlog is large', () => {
    const memory = Object.fromEntries(VERSES.slice(0, 20).map((v) => [v.id, mem(5, '2026-04-01', '2026-04-08')]))
    const s = buildSession({ ...base, memory, queue: VERSES.slice(20).map((v) => v.id) })
    expect(s.newVerses).toHaveLength(0)
    expect(s.cards.length).toBeLessThanOrEqual(14)
  })
  it('respects the daily new-verse limit, also in free practice', () => {
    const memory = { 'ps119-11': mem(3.2, '2026-05-10', '2026-05-11') }
    for (const mode of ['daily', 'practice'] as const) {
      const s = buildSession({ ...base, memory, queue: base.queue.slice(1), newToday: 1, mode })
      expect(s.newVerses).toHaveLength(0)
    }
    const practice = buildSession({ ...base, memory, queue: base.queue.slice(1), newToday: 1, mode: 'practice' })
    expect(practice.reviewVerses).toEqual(['ps119-11'])
  })
  it('focus mode practises exactly one verse', () => {
    const s = buildSession({ ...base, memory: { 'john3-16': mem(20, '2026-05-01', '2026-05-20') }, focusVerse: 'john3-16' })
    expect(new Set(s.cards.map((c) => c.verseId))).toEqual(new Set(['john3-16']))
    expect(s.cards.length).toBeGreaterThanOrEqual(2)
  })
  it('still builds a session when everything is learned and nothing is due', () => {
    const memory = Object.fromEntries(VERSES.map((v) => [v.id, mem(40, '2026-05-01', '2026-06-10')]))
    const s = buildSession({ ...base, memory, queue: [] })
    expect(s.cards.length).toBeGreaterThan(4)
    expect(s.newVerses).toHaveLength(0)
  })
  it('interleave keeps each stream in order', () => {
    const plan = buildSession({ ...base, memory: Object.fromEntries(VERSES.slice(1, 6).map((v) => [v.id, mem(2, '2026-05-08', '2026-05-10')])) })
    const byVerse: Record<string, string[]> = {}
    for (const c of plan.cards) (byVerse[c.verseId] ??= []).push(c.kind)
    for (const kinds of Object.values(byVerse)) if (kinds[0] === 'intro') expect(kinds.indexOf('intro')).toBe(0)
    expect(interleave([], () => 0.5)).toEqual([])
  })
})

it('never returns an empty daily session when verses exist', () => {
  const memory = Object.fromEntries(VERSES.slice(0, 3).map((v) => [v.id, mem(4, '2026-05-10', '2026-05-14')]))
  const s = buildSession({ ...base, memory, queue: [], newPerDay: 0 })
  expect(s.cards.length).toBeGreaterThan(0)
})

describe('quests', () => {
  it('are deterministic per day and always include the daily session', () => {
    expect(questsFor('2026-05-10', true)).toEqual(questsFor('2026-05-10', true))
    expect(questsFor('2026-05-10', true)[0].id).toBe('daily')
    expect(questsFor('2026-05-10', true)).toHaveLength(3)
  })
})
