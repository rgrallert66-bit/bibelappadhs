import type { Verse } from '../data/verses'
import type { Lang } from '../lib/i18n'

export interface ExerciseApi {
  /** A single correct decision (word, tile, letter…). */
  correct: () => void
  /** A single wrong decision. */
  wrong: () => void
  /** The card is finished. */
  done: (r: { errors: number; items: number }) => void
}

export interface ExProps<E> {
  ex: E
  verse: Verse
  reference: string
  lang: Lang
  api: ExerciseApi
  /** True once the card is solved – exercises switch into a calm "review" look. */
  solved: boolean
}
