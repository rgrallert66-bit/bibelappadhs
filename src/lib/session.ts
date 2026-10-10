import type { Verse, TranslationId } from '../data/verses'
import {
  makeChain, makeCloze, makeIntro, makeLetters, makeOrder, makeReference, makeSpot,
  type CardResult, type Exercise, type GenContext,
} from './exercises'
import { retrievability, type Grade, type MemoryState } from './fsrs'
import { daysBetween } from './dates'
import { tokenize, type Token } from './text'
import { rng, hashString } from './random'

export type DailyGoal = 'light' | 'normal' | 'deep'

export const GOALS: Record<DailyGoal, { cards: number; minutes: number; label: string; labelEn: string }> = {
  light: { cards: 8, minutes: 3, label: 'Locker', labelEn: 'Easy' },
  normal: { cards: 12, minutes: 5, label: 'Stetig', labelEn: 'Steady' },
  deep: { cards: 20, minutes: 10, label: 'Tief', labelEn: 'Deep' },
}

export interface PlanInput {
  verses: Record<string, Verse>
  memory: Record<string, MemoryState>
  queue: string[]
  today: string
  goal: DailyGoal
  newPerDay: number
  newToday: number
  bias: number
  translation: TranslationId
  /** 'daily' counts for the tree; 'practice' is optional extra time. */
  mode: 'daily' | 'practice'
  /** Optional: practise exactly this verse. */
  focusVerse?: string
  seed?: number
}

export interface SessionPlan {
  cards: Exercise[]
  newVerses: string[]
  reviewVerses: string[]
  mode: 'daily' | 'practice' | 'focus'
}

export function textOf(v: Verse, t: TranslationId) {
  return v.text[t]
}

function poolFor(verses: Verse[], t: TranslationId): Token[] {
  return verses.flatMap((v) => tokenize(textOf(v, t)))
}

/** Strength 0–3 → how much support a review gets. */
export function strengthOf(m: MemoryState, today: string, bias: number): number {
  const r = retrievability(daysBetween(m.last, today), m.stability)
  let s = m.stability < 2 ? 0 : m.stability < 6 ? 1 : m.stability < 15 ? 2 : 3
  if (r < 0.75) s -= 1 // long gap → give a little more support first
  if (bias > 0.5) s += 1
  if (bias < -0.5) s -= 1
  return Math.max(0, Math.min(3, s))
}

function reviewCards(v: Verse, m: MemoryState, input: PlanInput, ctx: GenContext): Exercise[] {
  const text = textOf(v, input.translation)
  const s = strengthOf(m, input.today, input.bias)
  const r = ctx.rand()
  switch (s) {
    case 0:
      return [makeCloze(v.id, text, ctx, 'review', 0), makeLetters(v.id, text, 1, 'review')]
    case 1:
      return [r < 0.5 ? makeChain(v.id, text, ctx, 'review') : makeOrder(v.id, text, ctx, 'review'), makeLetters(v.id, text, 2, 'review')]
    case 2: {
      const warm = r < 0.33 ? makeSpot(v.id, text, ctx, 'review') : r < 0.66 ? makeCloze(v.id, text, ctx, 'review', 2) : makeChain(v.id, text, ctx, 'review')
      return [warm, makeLetters(v.id, text, 2, 'review')]
    }
    default:
      return r < 0.3 && ctx.otherVerseIds.length > 3
        ? [makeReference(v.id, ctx, 'review'), makeLetters(v.id, text, 3, 'review')]
        : [makeLetters(v.id, text, 3, 'review')]
  }
}

function learnCards(v: Verse, input: PlanInput, ctx: GenContext): Exercise[] {
  const text = textOf(v, input.translation)
  const short = tokenize(text).length <= 7
  return [
    makeIntro(v.id, text, 'learn'),
    makeOrder(v.id, text, ctx, 'learn'),
    makeCloze(v.id, text, ctx, 'learn', 0),
    ...(short ? [] : [makeChain(v.id, text, ctx, 'learn')]),
    makeLetters(v.id, text, 1, 'learn', false),
    makeLetters(v.id, text, 2, 'learn', true),
  ]
}

/** Interleaves several card streams so that a verse's cards are spaced apart. */
export function interleave(streams: Exercise[][], rand: () => number): Exercise[] {
  const out: Exercise[] = []
  const queues = streams.map((s) => [...s]).filter((s) => s.length)
  const lastAt = new Map<number, number>()
  while (queues.some((q) => q.length)) {
    const candidates = queues
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => q.length)
      .map(({ q, i }) => {
        const gap = out.length - (lastAt.get(i) ?? -10)
        // learning streams want their next card soon but not immediately (spacing)
        const score = q.length * 1.4 + Math.min(gap, 4) * 1.2 + rand() * 0.8 - (gap <= 1 && queues.filter((x) => x.length).length > 1 ? 6 : 0)
        return { i, score }
      })
      .sort((a, b) => b.score - a.score)
    const { i } = candidates[0]
    const card = queues[i].shift()!
    // avoid two identical kinds in a row when there's an alternative
    const prev = out[out.length - 1]
    if (prev && prev.kind === card.kind && candidates.length > 1) {
      const alt = candidates[1]
      const altCard = queues[alt.i][0]
      if (altCard && altCard.kind !== card.kind) {
        queues[i].unshift(card)
        out.push(queues[alt.i].shift()!)
        lastAt.set(alt.i, out.length - 1)
        continue
      }
    }
    out.push(card)
    lastAt.set(i, out.length - 1)
  }
  // An intro must come before its other cards; keep the first learn stream intact.
  return out
}

export function buildSession(input: PlanInput): SessionPlan {
  const rand = rng(input.seed ?? hashString(input.today + input.mode + Date.now()))
  const all = Object.values(input.verses)
  const translationVerses = all.filter((v) => !v.custom || v.custom.translation === input.translation)
  const ctx: GenContext = {
    rand,
    bias: input.bias,
    pool: poolFor(translationVerses.filter((v) => !v.custom), input.translation),
    otherVerseIds: translationVerses.filter((v) => input.memory[v.id]).map((v) => v.id),
  }
  if (ctx.otherVerseIds.length < 4) ctx.otherVerseIds = translationVerses.map((v) => v.id)

  if (input.focusVerse) {
    const v = input.verses[input.focusVerse]
    const m = input.memory[v.id]
    const cards = m ? reviewCards(v, m, input, ctx) : learnCards(v, input, ctx)
    if (m && cards.length === 1) cards.unshift(makeChain(v.id, textOf(v, input.translation), ctx, 'review'))
    return { cards, newVerses: m ? [] : [v.id], reviewVerses: m ? [v.id] : [], mode: 'focus' }
  }

  const budget = GOALS[input.goal].cards
  const learned = translationVerses.filter((v) => input.memory[v.id])
  const due = learned
    .filter((v) => input.memory[v.id].due <= input.today)
    .sort((a, b) => {
      const ma = input.memory[a.id]
      const mb = input.memory[b.id]
      return (
        retrievability(daysBetween(ma.last, input.today), ma.stability) -
        retrievability(daysBetween(mb.last, input.today), mb.stability)
      )
    })

  const streams: Exercise[][] = []
  const newVerses: string[] = []
  const reviewVerses: string[] = []
  let used = 0

  const queue = input.queue.filter((id) => input.verses[id] && !input.memory[id])
  const wantNew = input.mode === 'daily' ? Math.max(0, input.newPerDay - input.newToday) : 0
  // New verses only when the review load leaves room – protect what is already growing.
  const dueCost = due.reduce((s, v) => s + (input.memory[v.id].stability < 15 ? 2 : 1), 0)
  let newSlots = wantNew
  if (dueCost > budget * 1.5) newSlots = 0
  else if (dueCost > budget - 5) newSlots = Math.min(newSlots, 1)

  // Learning stream first so the session opens with discovery, not testing.
  for (const id of queue.slice(0, newSlots)) {
    const cards = learnCards(input.verses[id], input, ctx)
    streams.push(cards)
    newVerses.push(id)
    used += cards.length
  }

  for (const v of due) {
    if (used >= budget) break
    const cards = reviewCards(v, input.memory[v.id], input, ctx)
    streams.push(cards)
    reviewVerses.push(v.id)
    used += cards.length
  }

  // Room left → strengthen the weakest verses that aren't due yet.
  if (used < budget) {
    const extra = learned
      .filter((v) => !reviewVerses.includes(v.id) && input.memory[v.id].last !== input.today)
      .sort((a, b) => input.memory[a.id].stability - input.memory[b.id].stability)
    for (const v of extra) {
      if (used >= budget - 1) break
      const cards = reviewCards(v, input.memory[v.id], input, ctx)
      streams.push(cards)
      reviewVerses.push(v.id)
      used += cards.length
    }
  }

  // Nothing at all to review and no new verse planned (e.g. practice mode before any learning)
  if (!streams.length && queue.length) {
    const cards = learnCards(input.verses[queue[0]], input, ctx)
    streams.push(cards)
    newVerses.push(queue[0])
  }

  let cards: Exercise[]
  if (newVerses.length) {
    // Intro + order of each new verse open the session; the rest is interleaved.
    const openers = streams.slice(0, newVerses.length).flatMap((s) => s.splice(0, 2))
    cards = [...openers, ...interleave(streams, rand)]
  } else {
    cards = interleave(streams, rand)
  }
  return { cards, newVerses, reviewVerses, mode: input.mode }
}

/** Turns all of a verse's card results from this session into an FSRS grade. */
export function gradeVerse(results: CardResult[]): Grade {
  if (!results.length) return 3
  const final = results[results.length - 1]
  const rate = final.items ? final.errors / final.items : 0
  const totalErrors = results.reduce((s, r) => s + r.errors, 0)
  const totalItems = results.reduce((s, r) => s + r.items, 0)
  const overall = totalItems ? totalErrors / totalItems : 0
  if (rate > 0.3) return 1
  if (rate > 0.12 || overall > 0.25) return 2
  if (rate > 0) return 3
  if (final.kind === 'letters' && final.hint === 3 && overall === 0 && final.ms / Math.max(1, final.items) < 1400) return 4
  return 3
}

/** Adaptive difficulty: nudge toward ~85 % success (Wilson et al., 2019). */
export function updateBias(bias: number, errors: number, items: number): number {
  if (!items) return bias
  const acc = 1 - errors / items
  const delta = (acc - 0.85) * 0.5
  return Math.max(-1, Math.min(1, bias + delta))
}
