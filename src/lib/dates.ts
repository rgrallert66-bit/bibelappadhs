/** Calendar helpers. A "day key" is the user's local date, YYYY-MM-DD. */

export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function addDays(key: string, n: number): string {
  const d = parseDay(key)
  d.setDate(d.getDate() + n)
  return dayKey(d)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86400000)
}

export interface StreakInfo {
  /** Consecutive learning days, bridging rest days. */
  count: number
  /** Days inside the current streak that were bridged by grace. */
  restDays: string[]
  /** Whether today is already a learning day. */
  today: boolean
  /** True if the streak survives only if the user learns today. */
  atRisk: boolean
}

/**
 * Streak with "Ruhetag" grace: one missed day per 7 is forgiven automatically.
 * Two missed days in a row – or two within a week – end the streak.
 * The tree itself never shrinks; the streak is only a gentle rhythm signal.
 */
export function streak(learnDays: Set<string>, today: string = dayKey()): StreakInfo {
  const isToday = learnDays.has(today)
  let cursor = isToday ? today : addDays(today, -1)
  let count = 0
  const restDays: string[] = []
  let lastBridge: string | null = null
  for (let guard = 0; guard < 20000; guard++) {
    if (learnDays.has(cursor)) {
      count++
      cursor = addDays(cursor, -1)
      continue
    }
    const prev = addDays(cursor, -1)
    const canBridge = learnDays.has(prev) && (lastBridge === null || daysBetween(cursor, lastBridge) >= 7)
    if (!canBridge) break
    restDays.push(cursor)
    lastBridge = cursor
    cursor = prev
  }
  const atRisk = !isToday && count > 0 && restDays.includes(addDays(today, -1))
  return { count, restDays, today: isToday, atRisk }
}

export function weekDays(today: string = dayKey()): string[] {
  // Monday-based week containing today
  const d = parseDay(today)
  const dow = (d.getDay() + 6) % 7
  const monday = addDays(today, -dow)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export function season(d: Date = new Date()): Season {
  const m = d.getMonth()
  if (m >= 2 && m <= 4) return 'spring'
  if (m >= 5 && m <= 7) return 'summer'
  if (m >= 8 && m <= 10) return 'autumn'
  return 'winter'
}
