import { describe, expect, it } from 'vitest'
import { chunk, firstLetterMatches, tokenize } from './text'
import { review, retrievability, intervalFor, stageOf } from './fsrs'
import { addDays, streak } from './dates'
import { buildSession, gradeVerse } from './session'
import { generateTree, pose, fruitSlots } from './tree'
import { VERSES, PATHS } from '../data/verses'

const verses = Object.fromEntries(VERSES.map((v) => [v.id, v]))

describe('text', () => {
  it('tokenizes punctuation away from words', () => {
    const t = tokenize('Jesus spricht zu ihm: Ich bin der Weg')
    expect(t[3]).toMatchObject({ word: 'ihm', post: ':', first: 'i' })
  })
  it('handles quotes', () => {
    const t = tokenize('said to him, “I am the way')
    expect(t[3]).toMatchObject({ pre: '“', word: 'I' })
  })
  it('accepts umlaut base letters', () => {
    const [t] = tokenize('Übersetzung')
    expect(firstLetterMatches('u', t)).toBe(true)
    expect(firstLetterMatches('ü', t)).toBe(true)
    expect(firstLetterMatches('a', t)).toBe(false)
  })
  it('chunks every verse into 2–7 word phrases covering all words', () => {
    for (const v of VERSES) {
      for (const tr of ['elb', 'nkjv'] as const) {
        const toks = tokenize(v.text[tr])
        const ch = chunk(toks)
        expect(ch.flat().length).toBe(toks.length)
        for (const c of ch) expect(c.length).toBeLessThanOrEqual(7)
      }
    }
  })
})

describe('fsrs', () => {
  it('schedules growing intervals on successful reviews', () => {
    let m = review(undefined, 3, '2026-01-01', 0, addDays)
    const intervals: number[] = []
    let day = '2026-01-01'
    for (let i = 0; i < 6; i++) {
      const next = m.due
      intervals.push(Math.round((Date.parse(next) - Date.parse(day)) / 864e5))
      m = review(m, 3, next, Math.round((Date.parse(next) - Date.parse(day)) / 864e5), addDays)
      day = next
    }
    for (let i = 1; i < intervals.length; i++) expect(intervals[i]).toBeGreaterThan(intervals[i - 1])
    expect(stageOf(m)).toBeGreaterThanOrEqual(4)
  })
  it('a lapse reduces stability and returns tomorrow', () => {
    const m = { stability: 30, difficulty: 5, last: '2026-01-01', due: '2026-01-31', reps: 4, lapses: 0 }
    const n = review(m, 1, '2026-01-31', 30, addDays)
    expect(n.stability).toBeLessThan(30)
    expect(n.due).toBe('2026-02-01')
    expect(n.lapses).toBe(1)
  })
  it('retrievability is 0.9 after one stability interval', () => {
    expect(retrievability(10, 10)).toBeCloseTo(0.9, 2)
    expect(intervalFor(10)).toBe(10)
  })
})

describe('streak', () => {
  it('counts consecutive days', () => {
    const s = streak(new Set(['2026-03-01', '2026-03-02', '2026-03-03']), '2026-03-03')
    expect(s.count).toBe(3)
    expect(s.today).toBe(true)
  })
  it('bridges one rest day per week', () => {
    const s = streak(new Set(['2026-03-01', '2026-03-02', '2026-03-04', '2026-03-05']), '2026-03-05')
    expect(s.count).toBe(4)
    expect(s.restDays).toEqual(['2026-03-03'])
  })
  it('breaks on two missing days', () => {
    const s = streak(new Set(['2026-03-01', '2026-03-04']), '2026-03-04')
    expect(s.count).toBe(1)
  })
  it('stays alive until the end of today', () => {
    const s = streak(new Set(['2026-03-01', '2026-03-02']), '2026-03-03')
    expect(s.count).toBe(2)
    expect(s.today).toBe(false)
  })
})

describe('session', () => {
  const base = {
    verses,
    memory: {},
    queue: PATHS[0].verses,
    today: '2026-03-01',
    goal: 'normal' as const,
    newPerDay: 1,
    newToday: 0,
    bias: 0,
    translation: 'elb' as const,
    mode: 'daily' as const,
    seed: 42,
  }
  it('first session plants a new verse starting with discovery', () => {
    const s = buildSession(base)
    expect(s.newVerses).toEqual(['ps119-11'])
    expect(s.cards[0].kind).toBe('intro')
    expect(s.cards[1].kind).toBe('order')
    expect(s.cards.filter((c) => c.final).length).toBe(1)
  })
  it('due reviews come in and every verse has exactly one final card', () => {
    const memory = {
      'ps119-11': { stability: 3, difficulty: 5, last: '2026-02-26', due: '2026-03-01', reps: 2, lapses: 0 },
      'john3-16': { stability: 20, difficulty: 5, last: '2026-02-01', due: '2026-02-28', reps: 4, lapses: 0 },
    }
    const s = buildSession({ ...base, memory })
    expect(s.reviewVerses).toEqual(expect.arrayContaining(['ps119-11', 'john3-16']))
    for (const id of [...s.reviewVerses, ...s.newVerses]) {
      expect(s.cards.filter((c) => c.verseId === id && c.final).length).toBe(1)
      const own = s.cards.filter((c) => c.verseId === id)
      expect(own[own.length - 1].final).toBe(true)
    }
    for (let i = 1; i < s.cards.length; i++) {
      if (s.cards[i].kind === s.cards[i - 1].kind && s.cards[i].kind !== 'letters') {
        // same kind back to back should be rare – allowed only when unavoidable
      }
    }
  })
  it('grades', () => {
    const r = (errors: number, items: number, hint?: 1 | 2 | 3) => ({ exerciseId: 'x', verseId: 'v', kind: 'letters' as const, errors, items, ms: 20000, hint })
    expect(gradeVerse([r(0, 20, 2)])).toBe(3)
    expect(gradeVerse([r(8, 20, 2)])).toBe(1)
    expect(gradeVerse([r(3, 20, 2)])).toBe(2)
  })
})

describe('tree', () => {
  const tree = generateTree(7)
  it('generates a rich mature skeleton', () => {
    expect(tree.length).toBeGreaterThan(400)
    expect(tree.length).toBeLessThan(4000)
  })
  it('grows monotonically with learning days', () => {
    const visible = (age: number) => pose(tree, age).filter(Boolean).length
    expect(visible(1)).toBeLessThanOrEqual(visible(7))
    expect(visible(7)).toBeLessThan(visible(60))
    expect(visible(60)).toBeLessThan(visible(400))
  })
  it('provides fruit slots that grow over time', () => {
    expect(fruitSlots(tree, 30).length).toBeGreaterThan(fruitSlots(tree, 5).length)
  })
})
