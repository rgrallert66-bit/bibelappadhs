import { chunk, isContentWord, joinTokens, tokenize, type Token } from './text'
import { pick, shuffle } from './random'

/**
 * Exercise kinds, ordered roughly from most to least supported recall.
 * Together they implement "vanishing cues": the learner always retrieves, but the
 * amount of help fades as memory strengthens (errorless start → effortful recall).
 */
export type ExerciseKind =
  | 'intro' // Entdecken: read the verse phrase by phrase (encoding, chunking)
  | 'order' // Ordnen: put phrases in order (structure, serial recall with cues)
  | 'cloze' // Lücke: pick missing words (cued recall)
  | 'chain' // Wortkette: build the verse word by word from 2–3 choices (sequential recall)
  | 'spot' // Fehlersuche: find the word that doesn't belong (discrimination)
  | 'letters' // Anfangsbuchstaben: type each word's first letter (near-free recall)
  | 'reference' // Fundstelle: connect text and reference (retrieval cue for the address)

export interface ExerciseBase {
  id: string
  verseId: string
  kind: ExerciseKind
  /** Whether this card completes the verse's work in this session (→ scheduling). */
  final: boolean
  /** New verse being planted vs. existing verse being reviewed. */
  role: 'learn' | 'review'
}

export interface IntroEx extends ExerciseBase { kind: 'intro'; chunks: string[] }
export interface OrderEx extends ExerciseBase { kind: 'order'; chunks: string[]; shuffled: number[] }
export interface ClozeEx extends ExerciseBase {
  kind: 'cloze'
  tokens: Token[]
  gaps: number[]
  options: string[][]
}
export interface ChainEx extends ExerciseBase {
  kind: 'chain'
  tokens: Token[]
  /** Number of leading words already given. */
  given: number
  options: string[][]
}
export interface SpotEx extends ExerciseBase {
  kind: 'spot'
  tokens: Token[]
  wrongIndex: number
  wrongWord: string
}
export interface LettersEx extends ExerciseBase {
  kind: 'letters'
  tokens: Token[]
  /** 1 = faint words visible, 2 = word shapes only, 3 = nothing but the reference */
  hint: 1 | 2 | 3
}
export interface ReferenceEx extends ExerciseBase {
  kind: 'reference'
  mode: 'toRef' | 'toText'
  options: string[]
}

export type Exercise = IntroEx | OrderEx | ClozeEx | ChainEx | SpotEx | LettersEx | ReferenceEx

export const KIND_LABEL: Record<ExerciseKind, { de: string; en: string }> = {
  intro: { de: 'Entdecken', en: 'Discover' },
  order: { de: 'Ordnen', en: 'Arrange' },
  cloze: { de: 'Lücke', en: 'Fill the gap' },
  chain: { de: 'Wortkette', en: 'Word chain' },
  spot: { de: 'Fehlersuche', en: 'Spot it' },
  letters: { de: 'Aus dem Herzen', en: 'By heart' },
  reference: { de: 'Fundstelle', en: 'Reference' },
}

export interface GenContext {
  rand: () => number
  /** All words of the active translation – distractor pool. */
  pool: Token[]
  /** -1 (struggling) … +1 (cruising) – adaptive difficulty. */
  bias: number
  /** Other verse ids (for reference quizzes). */
  otherVerseIds: string[]
}

let counter = 0
const uid = (verseId: string, kind: string) => `${verseId}:${kind}:${++counter}:${Date.now().toString(36)}`

/** Distractor words of similar shape, never equal to the answer. */
export function distractors(answer: Token, pool: Token[], n: number, rand: () => number, exclude: string[] = []): string[] {
  const banned = new Set([answer.key, ...exclude.map((e) => e.toLowerCase())])
  const capital = /^\p{Lu}/u.test(answer.word)
  const scored = shuffle(pool, rand)
    .filter((t) => !banned.has(t.key) && t.word.length > 1)
    .map((t) => ({
      t,
      score:
        Math.abs(t.word.length - answer.word.length) +
        (/^\p{Lu}/u.test(t.word) === capital ? 0 : 3) +
        (isContentWord(t) === isContentWord(answer) ? 0 : 2) +
        rand() * 2,
    }))
    .sort((a, b) => a.score - b.score)
  const out: string[] = []
  for (const { t } of scored) {
    if (out.length >= n) break
    if (!out.some((o) => o.toLowerCase() === t.word.toLowerCase())) out.push(t.word)
  }
  return out
}

export function makeIntro(verseId: string, text: string, role: ExerciseBase['role']): IntroEx {
  return { id: uid(verseId, 'intro'), verseId, kind: 'intro', role, final: false, chunks: chunk(tokenize(text)).map(joinTokens) }
}

export function makeOrder(verseId: string, text: string, ctx: GenContext, role: ExerciseBase['role'], final = false): OrderEx {
  const tokens = tokenize(text)
  // Finer pieces when the learner is doing well → harder puzzle.
  const max = ctx.bias > 0.4 ? 4 : 6
  let chunks = chunk(tokens, max).map(joinTokens)
  if (chunks.length < 3) chunks = chunk(tokens, 3).map(joinTokens)
  let shuffled = shuffle(chunks.map((_, i) => i), ctx.rand)
  // never start already solved
  if (shuffled.every((v, i) => v === i) && shuffled.length > 1) shuffled = [...shuffled.slice(1), shuffled[0]]
  return { id: uid(verseId, 'order'), verseId, kind: 'order', role, final, chunks, shuffled }
}

export function makeCloze(verseId: string, text: string, ctx: GenContext, role: ExerciseBase['role'], strength: number, final = false): ClozeEx {
  const tokens = tokenize(text)
  const content = tokens.map((t, i) => ({ t, i })).filter(({ t }) => isContentWord(t))
  const candidates = content.length >= 2 ? content : tokens.map((t, i) => ({ t, i }))
  const want = Math.min(candidates.length, Math.max(1, Math.round(1 + strength + Math.max(0, ctx.bias))))
  // spread the gaps across the verse
  const sorted = shuffle(candidates, ctx.rand).slice(0, want).map((c) => c.i).sort((a, b) => a - b)
  const nOpts = ctx.bias > 0.5 || strength >= 2 ? 4 : 3
  const options = sorted.map((i) => shuffle([tokens[i].word, ...distractors(tokens[i], ctx.pool, nOpts - 1, ctx.rand)], ctx.rand))
  return { id: uid(verseId, 'cloze'), verseId, kind: 'cloze', role, final, tokens, gaps: sorted, options }
}

export function makeChain(verseId: string, text: string, ctx: GenContext, role: ExerciseBase['role'], final = false): ChainEx {
  const tokens = tokenize(text)
  const given = tokens.length > 8 ? 2 : 1
  const nOpts = ctx.bias > 0.3 ? 3 : 2
  const options = tokens.map((t, i) => {
    const next = tokens[i + 1]
    const ex = next ? [next.word] : []
    return shuffle([t.word, ...distractors(t, ctx.pool, nOpts - 1, ctx.rand, ex)], ctx.rand)
  })
  return { id: uid(verseId, 'chain'), verseId, kind: 'chain', role, final, tokens, given, options }
}

export function makeSpot(verseId: string, text: string, ctx: GenContext, role: ExerciseBase['role'], final = false): SpotEx {
  const tokens = tokenize(text)
  const idxs = tokens.map((t, i) => ({ t, i })).filter(({ t }) => isContentWord(t))
  const target = (idxs.length ? pick(idxs, ctx.rand) : { t: tokens[0], i: 0 })
  const [wrongWord] = distractors(target.t, ctx.pool, 1, ctx.rand)
  return { id: uid(verseId, 'spot'), verseId, kind: 'spot', role, final, tokens, wrongIndex: target.i, wrongWord: wrongWord ?? 'nie' }
}

export function makeLetters(verseId: string, text: string, hint: 1 | 2 | 3, role: ExerciseBase['role'], final = true): LettersEx {
  return { id: uid(verseId, 'letters'), verseId, kind: 'letters', role, final, tokens: tokenize(text), hint }
}

export function makeReference(verseId: string, ctx: GenContext, role: ExerciseBase['role']): ReferenceEx {
  const others = shuffle(ctx.otherVerseIds.filter((id) => id !== verseId), ctx.rand).slice(0, 3)
  return {
    id: uid(verseId, 'reference'),
    verseId,
    kind: 'reference',
    role,
    final: false,
    mode: ctx.rand() < 0.5 ? 'toRef' : 'toText',
    options: shuffle([verseId, ...others], ctx.rand),
  }
}

/**
 * Per-card result reported by the UI.
 * `errors` counts wrong taps / letters; `items` the number of decisions made.
 */
export interface CardResult {
  exerciseId: string
  verseId: string
  kind: ExerciseKind
  errors: number
  items: number
  ms: number
  hint?: 1 | 2 | 3
}
