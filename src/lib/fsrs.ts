/**
 * FSRS-5 (Free Spaced Repetition Scheduler) – the open, empirically fitted successor
 * to SM-2. It models each verse's memory with
 *   – stability S: days until recall probability drops to 90 %
 *   – difficulty D: 1 (easy) … 10 (hard)
 * and schedules the next review exactly when recall is predicted to fall to the
 * desired retention. Reviewing right at the edge of forgetting gives the largest
 * stability gain per minute spent (spacing + testing effect).
 *
 * Parameters are the published FSRS-5 defaults (open-spaced-repetition/fsrs4anki).
 */

export type Grade = 1 | 2 | 3 | 4 // Again, Hard, Good, Easy

export interface MemoryState {
  stability: number
  difficulty: number
  /** Day key of the last review. */
  last: string
  /** Day key when the verse is due. */
  due: string
  reps: number
  lapses: number
}

const W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925,
  1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
]
const DECAY = -0.5
const FACTOR = 19 / 81
export const DESIRED_RETENTION = 0.9
const MAX_INTERVAL = 3650

const clampD = (d: number) => Math.min(10, Math.max(1, d))

export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / stability, DECAY)
}

export function intervalFor(stability: number, retention = DESIRED_RETENTION): number {
  const i = (stability / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1)
  return Math.min(MAX_INTERVAL, Math.max(1, Math.round(i)))
}

const initStability = (g: Grade) => Math.max(0.1, W[g - 1])
const initDifficulty = (g: Grade) => clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1)

function nextDifficulty(d: number, g: Grade): number {
  const delta = -W[6] * (g - 3)
  const damped = d + (delta * (10 - d)) / 9
  return clampD(W[7] * initDifficulty(4) + (1 - W[7]) * damped)
}

function recallStability(d: number, s: number, r: number, g: Grade): number {
  const hard = g === 2 ? W[15] : 1
  const easy = g === 4 ? W[16] : 1
  return (
    s *
    (Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hard * easy + 1)
  )
}

function forgetStability(d: number, s: number, r: number): number {
  const sNew = W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r))
  return Math.min(sNew, s)
}

function shortTermStability(s: number, g: Grade): number {
  return s * Math.exp(W[17] * (g - 3 + W[18]))
}

/**
 * Applies a review. `elapsed` is days since the previous review (0 = same day).
 * Returns the new state plus the scheduled interval in days.
 */
export function review(
  prev: MemoryState | undefined,
  g: Grade,
  today: string,
  elapsed: number,
  addDays: (k: string, n: number) => string,
): MemoryState {
  let stability: number
  let difficulty: number
  let lapses = prev?.lapses ?? 0
  if (!prev) {
    stability = initStability(g)
    difficulty = initDifficulty(g)
  } else if (elapsed === 0) {
    stability = shortTermStability(prev.stability, g)
    difficulty = nextDifficulty(prev.difficulty, g)
  } else {
    const r = retrievability(elapsed, prev.stability)
    difficulty = nextDifficulty(prev.difficulty, g)
    if (g === 1) {
      stability = forgetStability(prev.difficulty, prev.stability, r)
      lapses++
    } else {
      stability = recallStability(prev.difficulty, prev.stability, r, g)
    }
  }
  stability = Math.max(0.1, stability)
  // A failed or shaky verse comes back tomorrow; otherwise follow the model.
  const interval = g === 1 ? 1 : intervalFor(stability)
  return {
    stability,
    difficulty,
    last: today,
    due: addDays(today, interval),
    reps: (prev?.reps ?? 0) + 1,
    lapses,
  }
}

/** Growth stages a verse passes through – also how it appears on the tree. */
export type Stage = 0 | 1 | 2 | 3 | 4 | 5

export const STAGE_NAMES: Record<Stage, { de: string; en: string }> = {
  0: { de: 'Samen', en: 'Seed' },
  1: { de: 'Keim', en: 'Sprout' },
  2: { de: 'Spross', en: 'Shoot' },
  3: { de: 'Knospe', en: 'Bud' },
  4: { de: 'Blüte', en: 'Blossom' },
  5: { de: 'Frucht', en: 'Fruit' },
}

export const STAGE_THRESHOLDS = [0, 0, 3.5, 10, 30, 90] as const

export function stageOf(m: MemoryState | undefined): Stage {
  if (!m) return 0
  const s = m.stability
  if (s >= STAGE_THRESHOLDS[5]) return 5
  if (s >= STAGE_THRESHOLDS[4]) return 4
  if (s >= STAGE_THRESHOLDS[3]) return 3
  if (s >= STAGE_THRESHOLDS[2]) return 2
  return 1
}
