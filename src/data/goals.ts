import { hashString, rng, shuffle } from '../lib/random'

/** Session counters that quests and achievements read from. */
export interface SessionStats {
  cards: number
  perfectCards: number
  perfectOrder: number
  letters: number
  maxCombo: number
  byHeart: number
  planted: number
  errors: number
  items: number
  ms: number
}

export const emptyStats = (): SessionStats => ({
  cards: 0, perfectCards: 0, perfectOrder: 0, letters: 0, maxCombo: 0, byHeart: 0, planted: 0, errors: 0, items: 0, ms: 0,
})

export type QuestMetric = keyof SessionStats | 'daily'

export interface QuestDef {
  id: string
  de: string
  en: string
  metric: QuestMetric
  target: number
  /** Max-type metrics compare the best single value instead of summing. */
  max?: boolean
}

export const QUESTS: QuestDef[] = [
  { id: 'daily', de: 'Vollende deinen Tagesgang', en: 'Finish today’s session', metric: 'daily', target: 1 },
  { id: 'combo', de: 'Erreiche eine 12er-Serie', en: 'Reach a streak of 12', metric: 'maxCombo', target: 12, max: true },
  { id: 'perfect', de: '5 Karten ganz ohne Fehler', en: '5 flawless cards', metric: 'perfectCards', target: 5 },
  { id: 'heart', de: 'Ein Vers ganz aus dem Herzen', en: 'One verse fully by heart', metric: 'byHeart', target: 1 },
  { id: 'letters', de: 'Tippe 80 Anfangsbuchstaben', en: 'Type 80 first letters', metric: 'letters', target: 80 },
  { id: 'order', de: '2 Ordnen-Rätsel fehlerfrei', en: '2 flawless arrange puzzles', metric: 'perfectOrder', target: 2 },
  { id: 'plant', de: 'Pflanze einen neuen Vers', en: 'Plant a new verse', metric: 'planted', target: 1 },
]

/** Three quests per day: always "finish your session" + two seeded by the date. */
export function questsFor(day: string, canPlant: boolean): QuestDef[] {
  const pool = QUESTS.filter((q) => q.id !== 'daily' && (canPlant || q.id !== 'plant'))
  const picked = shuffle(pool, rng(hashString(day))).slice(0, 2)
  return [QUESTS[0], ...picked]
}

export interface AchievementDef {
  id: string
  de: string
  en: string
  descDe: string
  descEn: string
  /** Glyph drawn in the medallion. */
  glyph: 'seed' | 'leaf' | 'fruit' | 'sun' | 'moon' | 'star' | 'flame' | 'crown' | 'book' | 'dove' | 'tree' | 'drop'
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-seed', de: 'Erster Same', en: 'First Seed', descDe: 'Deinen ersten Vers gepflanzt', descEn: 'Planted your first verse', glyph: 'seed' },
  { id: 'days-3', de: 'Wurzeln schlagen', en: 'Taking Root', descDe: '3 Lerntage', descEn: '3 learning days', glyph: 'drop' },
  { id: 'days-7', de: 'Eine Woche', en: 'One Week', descDe: '7 Lerntage', descEn: '7 learning days', glyph: 'leaf' },
  { id: 'days-30', de: 'Junger Baum', en: 'Young Tree', descDe: '30 Lerntage', descEn: '30 learning days', glyph: 'tree' },
  { id: 'days-100', de: 'Hundert Tage', en: 'Hundred Days', descDe: '100 Lerntage', descEn: '100 learning days', glyph: 'sun' },
  { id: 'days-365', de: 'Ein Jahresring', en: 'One Ring', descDe: '365 Lerntage', descEn: '365 learning days', glyph: 'crown' },
  { id: 'streak-7', de: 'Treue', en: 'Faithful', descDe: '7 Tage in Folge', descEn: '7 days in a row', glyph: 'flame' },
  { id: 'verses-5', de: 'Kleiner Garten', en: 'Small Garden', descDe: '5 Verse gepflanzt', descEn: '5 verses planted', glyph: 'leaf' },
  { id: 'verses-15', de: 'Weinberg', en: 'Vineyard', descDe: '15 Verse gepflanzt', descEn: '15 verses planted', glyph: 'book' },
  { id: 'blossom', de: 'Erste Blüte', en: 'First Blossom', descDe: 'Ein Vers erreicht die Blüte', descEn: 'A verse reached blossom', glyph: 'star' },
  { id: 'fruit', de: 'Erste Frucht', en: 'First Fruit', descDe: 'Ein Vers trägt Frucht', descEn: 'A verse bears fruit', glyph: 'fruit' },
  { id: 'flawless', de: 'Makellos', en: 'Flawless', descDe: 'Ein Tagesgang ohne Fehler', descEn: 'A session without mistakes', glyph: 'dove' },
  { id: 'combo-25', de: 'Im Fluss', en: 'In the Flow', descDe: 'Eine 25er-Serie', descEn: 'A streak of 25', glyph: 'drop' },
  { id: 'golden', de: 'Goldenes Blatt', en: 'Golden Leaf', descDe: 'Alle Tagesziele erfüllt', descEn: 'All daily goals met', glyph: 'leaf' },
  { id: 'evening', de: 'Abendlicht', en: 'Evening Light', descDe: 'Nach 21 Uhr gelernt', descEn: 'Learned after 9 pm', glyph: 'moon' },
  { id: 'morning', de: 'Morgenstund', en: 'Daybreak', descDe: 'Vor 7 Uhr gelernt', descEn: 'Learned before 7 am', glyph: 'sun' },
]
