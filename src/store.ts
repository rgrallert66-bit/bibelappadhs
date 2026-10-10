import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PATHS, VERSES, type TranslationId, type Verse } from './data/verses'
import { ACHIEVEMENTS, emptyStats, questsFor, type SessionStats } from './data/goals'
import { review, stageOf, type MemoryState } from './lib/fsrs'
import { addDays, dayKey, daysBetween, streak } from './lib/dates'
import { gradeVerse, updateBias, type DailyGoal } from './lib/session'
import type { CardResult } from './lib/exercises'
import { setHaptics, setSound } from './lib/feedback'

export type Theme = 'auto' | 'light' | 'dark'

export interface DayLog {
  cards: number
  errors: number
  items: number
  ms: number
}

export interface State {
  onboarded: boolean
  name: string
  translation: TranslationId
  goal: DailyGoal
  newPerDay: number
  sound: boolean
  haptics: boolean
  theme: Theme
  /** Memory per translation – the words differ, so does the memory. */
  memory: Record<TranslationId, Record<string, MemoryState>>
  /** Verses waiting to be planted, in order. */
  queue: string[]
  custom: Verse[]
  /** Day keys on which the daily session was completed. Drives the tree. */
  learnDays: string[]
  /** Days on which all daily quests were completed → golden leaves. */
  goldenDays: string[]
  /** New verses planted per day. */
  planted: Record<string, number>
  /** Per-day activity for the calendar. */
  log: Record<string, DayLog>
  /** Daily quest progress: day → stats for that day. */
  questDay: string
  questStats: SessionStats
  questDaily: number
  bias: number
  bestCombo: number
  totalCards: number
  achievements: Record<string, string>
  /** Learning-day count last shown on the tree → drives the growth animation. */
  treeSeen: number
  /** Verse that was most recently planted or advanced → highlighted on the tree. */
  highlight: string | null

  // actions
  finishOnboarding: (p: { translation: TranslationId; goal: DailyGoal; path: string; name?: string }) => void
  setSettings: (p: Partial<Pick<State, 'translation' | 'goal' | 'newPerDay' | 'sound' | 'haptics' | 'theme' | 'name'>>) => void
  enqueue: (verseId: string) => void
  enqueuePath: (pathId: string) => void
  addCustom: (label: string, text: string) => string
  removeCustom: (id: string) => void
  recordVerse: (verseId: string, results: CardResult[]) => { before: number; after: number }
  recordCards: (results: CardResult[]) => void
  finishSession: (p: { stats: SessionStats; mode: 'daily' | 'practice' | 'focus' }) => { newDay: boolean; newAchievements: string[]; golden: boolean }
  markTreeSeen: () => void
  reset: () => void
}

const initial = {
  onboarded: false,
  name: '',
  translation: 'elb' as TranslationId,
  goal: 'normal' as DailyGoal,
  newPerDay: 1,
  sound: true,
  haptics: true,
  theme: 'auto' as Theme,
  memory: { elb: {}, nkjv: {} } as State['memory'],
  queue: [] as string[],
  custom: [] as Verse[],
  learnDays: [] as string[],
  goldenDays: [] as string[],
  planted: {} as Record<string, number>,
  log: {} as Record<string, DayLog>,
  questDay: '',
  questStats: emptyStats(),
  questDaily: 0,
  bias: 0,
  bestCombo: 0,
  totalCards: 0,
  achievements: {} as Record<string, string>,
  treeSeen: 0,
  highlight: null as string | null,
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial,

      finishOnboarding: ({ translation, goal, path, name }) => {
        const first = PATHS.find((p) => p.id === path) ?? PATHS[0]
        const rest = PATHS.filter((p) => p.id !== first.id).flatMap((p) => p.verses)
        set({ onboarded: true, translation, goal, queue: [...first.verses, ...rest], name: name ?? '' })
      },

      setSettings: (p) => {
        if (p.sound !== undefined) setSound(p.sound)
        if (p.haptics !== undefined) setHaptics(p.haptics)
        set(p)
      },

      enqueue: (verseId) => set((s) => ({ queue: [verseId, ...s.queue.filter((id) => id !== verseId)] })),

      enqueuePath: (pathId) => {
        const path = PATHS.find((p) => p.id === pathId)
        if (!path) return
        set((s) => ({ queue: [...path.verses, ...s.queue.filter((id) => !path.verses.includes(id))] }))
      },

      addCustom: (label, text) => {
        const id = `custom-${Date.now().toString(36)}`
        const t = get().translation
        const verse: Verse = { id, book: 'ps', ref: { c: 0, v: 0 }, text: { elb: text, nkjv: text }, custom: { label, translation: t } }
        set((s) => ({ custom: [...s.custom, verse], queue: [id, ...s.queue] }))
        return id
      },

      removeCustom: (id) =>
        set((s) => {
          const memory = { elb: { ...s.memory.elb }, nkjv: { ...s.memory.nkjv } }
          delete memory.elb[id]
          delete memory.nkjv[id]
          return { custom: s.custom.filter((v) => v.id !== id), queue: s.queue.filter((q) => q !== id), memory }
        }),

      recordVerse: (verseId, results) => {
        const s = get()
        const t = s.translation
        const today = dayKey()
        const prev = s.memory[t][verseId]
        const g = gradeVerse(results)
        const elapsed = prev ? Math.max(0, daysBetween(prev.last, today)) : 0
        let next = review(prev, g, today, elapsed, addDays)
        // Freshly planted verses are checked again after a night's sleep.
        if (!prev) next = { ...next, due: addDays(today, 1) }
        const planted = prev ? s.planted : { ...s.planted, [today]: (s.planted[today] ?? 0) + 1 }
        set({
          memory: { ...s.memory, [t]: { ...s.memory[t], [verseId]: next } },
          planted,
          queue: s.queue.filter((id) => id !== verseId),
          highlight: verseId,
        })
        return { before: stageOf(prev), after: stageOf(next) }
      },

      recordCards: (results) => {
        const s = get()
        let bias = s.bias
        for (const r of results) bias = updateBias(bias, r.errors, r.items)
        set({ bias })
      },

      finishSession: ({ stats, mode }) => {
        const s = get()
        const today = dayKey()
        const days = new Set(s.learnDays)
        const newDay = mode === 'daily' && !days.has(today)
        if (newDay) days.add(today)
        const learnDays = [...days].sort()

        // daily quest accounting
        const qs = s.questDay === today ? { ...s.questStats } : emptyStats()
        const qd = (s.questDay === today ? s.questDaily : 0) + (mode === 'daily' ? 1 : 0)
        for (const k of Object.keys(stats) as (keyof SessionStats)[]) {
          qs[k] = k === 'maxCombo' ? Math.max(qs[k], stats[k]) : qs[k] + stats[k]
        }
        const quests = questsFor(today, true)
        const allDone = quests.every((q) => (q.metric === 'daily' ? qd : qs[q.metric]) >= q.target)
        const golden = allDone && !s.goldenDays.includes(today)
        const goldenDays = golden ? [...s.goldenDays, today] : s.goldenDays

        const log = { ...s.log }
        const l = log[today] ?? { cards: 0, errors: 0, items: 0, ms: 0 }
        log[today] = { cards: l.cards + stats.cards, errors: l.errors + stats.errors, items: l.items + stats.items, ms: l.ms + stats.ms }

        // achievements
        const memory = s.memory[s.translation]
        const stages = Object.values(memory).map(stageOf)
        const plantedTotal = Object.keys(memory).length
        const st = streak(new Set(learnDays), today)
        const hour = new Date().getHours()
        const earned: Record<string, boolean> = {
          'first-seed': plantedTotal >= 1,
          'days-3': learnDays.length >= 3,
          'days-7': learnDays.length >= 7,
          'days-30': learnDays.length >= 30,
          'days-100': learnDays.length >= 100,
          'days-365': learnDays.length >= 365,
          'streak-7': st.count >= 7,
          'verses-5': plantedTotal >= 5,
          'verses-15': plantedTotal >= 15,
          blossom: stages.some((x) => x >= 4),
          fruit: stages.some((x) => x >= 5),
          flawless: mode === 'daily' && stats.errors === 0 && stats.cards >= 6,
          'combo-25': stats.maxCombo >= 25,
          golden: goldenDays.length > 0,
          evening: hour >= 21,
          morning: hour < 7,
        }
        const achievements = { ...s.achievements }
        const newAchievements: string[] = []
        for (const a of ACHIEVEMENTS) {
          if (earned[a.id] && !achievements[a.id]) {
            achievements[a.id] = today
            newAchievements.push(a.id)
          }
        }

        set({
          learnDays,
          goldenDays,
          log,
          questDay: today,
          questStats: qs,
          questDaily: qd,
          bestCombo: Math.max(s.bestCombo, stats.maxCombo),
          totalCards: s.totalCards + stats.cards,
          achievements,
        })
        return { newDay, newAchievements, golden }
      },

      markTreeSeen: () => set({ treeSeen: get().learnDays.length, highlight: null }),

      reset: () => set({ ...initial, memory: { elb: {}, nkjv: {} }, questStats: emptyStats() }),
    }),
    {
      name: 'scripture-v1',
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) {
          setSound(state.sound)
          setHaptics(state.haptics)
        }
      },
    },
  ),
)

/** All verses known to the app (built-in + user's own). */
export function allVerses(custom: Verse[]): Record<string, Verse> {
  const map: Record<string, Verse> = {}
  for (const v of VERSES) map[v.id] = v
  for (const v of custom) map[v.id] = v
  return map
}

export function todayQuestProgress(s: State) {
  const today = dayKey()
  const qs = s.questDay === today ? s.questStats : emptyStats()
  const qd = s.questDay === today ? s.questDaily : 0
  const canPlant = true
  return questsFor(today, canPlant).map((q) => {
    const value = q.metric === 'daily' ? qd : qs[q.metric]
    return { ...q, value: Math.min(q.target, value), done: value >= q.target }
  })
}
