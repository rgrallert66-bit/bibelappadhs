import { useStore } from '../store'

export type Lang = 'de' | 'en'

/** UI language follows the chosen Bible: Elberfelder → Deutsch, NKJV → English. */
export function useLang(): Lang {
  return useStore((s) => (s.translation === 'nkjv' ? 'en' : 'de'))
}

export function useT() {
  const lang = useLang()
  return (de: string, en: string) => (lang === 'de' ? de : en)
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}
