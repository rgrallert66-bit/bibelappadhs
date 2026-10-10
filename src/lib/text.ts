/** Turning a verse into words and memorable phrases. */

export interface Token {
  /** Exactly as displayed, including punctuation. */
  raw: string
  /** Leading punctuation, e.g. an opening quote. */
  pre: string
  /** The word itself without surrounding punctuation. */
  word: string
  /** Trailing punctuation. */
  post: string
  /** Lower-cased, accent-folded comparison key. */
  key: string
  /** First letter (lower case, umlaut preserved). */
  first: string
}

const WORD_RE = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u

export function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function tokenize(text: string): Token[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => {
      const m = raw.match(WORD_RE)!
      const word = m[2] || raw
      return {
        raw,
        pre: m[1],
        word,
        post: m[3],
        key: fold(word),
        first: word.charAt(0).toLowerCase(),
      }
    })
}

/** Whether a typed letter counts for a word's first letter (umlauts accept their base). */
export function firstLetterMatches(typed: string, token: Token): boolean {
  const t = typed.toLowerCase()
  if (t === token.first) return true
  return fold(t) === fold(token.first)
}

const BREAK_AFTER = /[,;:.!?–]["“”»«']?$/

/** Words before which a phrase may naturally break (conjunctions, prepositions, relatives). */
const BREAK_BEFORE = new Set(
  [
    'und', 'damit', 'dass', 'denn', 'sondern', 'aber', 'als', 'wie', 'wenn', 'der', 'die', 'das', 'den', 'dem',
    'mit', 'nach', 'in', 'im', 'auf', 'zu', 'zum', 'zur', 'von', 'vor', 'für', 'durch', 'über',
    'and', 'that', 'for', 'but', 'with', 'to', 'of', 'which', 'who', 'whose', 'by', 'through', 'as', 'nor', 'or', 'from', 'upon', 'on', 'like', 'in',
  ].map(fold),
)

/** Words that bind to the following word – never end a phrase on them. */
const BINDS_NEXT = new Set(
  [
    'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'mein', 'meine', 'meinen', 'meinem',
    'dein', 'deine', 'deinen', 'deinem', 'sein', 'seine', 'seinen', 'seinem', 'seiner', 'unser', 'unsere', 'euer', 'eure', 'ihre',
    'für', 'mit', 'von', 'zu', 'auf', 'in', 'an', 'bei', 'aus', 'nach', 'über', 'durch', 'zum', 'zur', 'im', 'vor', 'all', 'alle',
    'the', 'a', 'an', 'my', 'your', 'his', 'her', 'our', 'their', 'its', 'of', 'to', 'on', 'with', 'by', 'from', 'at', 'into', 'upon', 'i', 'he', 'she', 'we', 'they', 'you',
  ].map(fold),
)

function splitLong(clause: Token[], maxLen: number): Token[][] {
  if (clause.length <= maxLen + 1) return [clause]
  const parts = Math.ceil(clause.length / maxLen)
  const target = clause.length / parts
  // best break near the ideal position, preferring natural break words
  let best = Math.round(target)
  let bestScore = Infinity
  for (let i = 2; i <= clause.length - 2; i++) {
    const natural = BREAK_BEFORE.has(clause[i].key) ? -1.6 : 0
    const binds = BINDS_NEXT.has(clause[i - 1].key) ? 3 : 0
    const score = Math.abs(i - target) + natural + binds
    if (score < bestScore) {
      bestScore = score
      best = i
    }
  }
  return [...splitLong(clause.slice(0, best), maxLen), ...splitLong(clause.slice(best), maxLen)]
}

/**
 * Splits tokens into short meaningful phrases ("chunks"). Chunking keeps each piece
 * inside working-memory limits (≈3–6 words) while following the verse's own rhythm:
 * first at punctuation, then – for long clauses – before conjunctions or prepositions.
 */
export function chunk(tokens: Token[], maxLen = 6): Token[][] {
  const clauses: Token[][] = []
  let cur: Token[] = []
  for (const t of tokens) {
    cur.push(t)
    if (BREAK_AFTER.test(t.raw)) {
      clauses.push(cur)
      cur = []
    }
  }
  if (cur.length) clauses.push(cur)
  // merge single-word clauses into a neighbour
  const merged: Token[][] = []
  for (const c of clauses) {
    const prev = merged[merged.length - 1]
    if (prev && (c.length < 2 || prev.length < 2) && prev.length + c.length <= maxLen + 1) prev.push(...c)
    else merged.push([...c])
  }
  return merged.flatMap((c) => splitLong(c, maxLen))
}

export function joinTokens(tokens: Token[]): string {
  return tokens.map((t) => t.raw).join(' ')
}

/** Words that carry little meaning – useful to avoid as cloze targets early on. */
const FILLERS = new Set(
  [
    'und', 'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'zu', 'in', 'im',
    'an', 'auf', 'mit', 'von', 'als', 'ist', 'es', 'er', 'sie', 'ihr', 'wir', 'ich', 'du', 'nicht', 'so',
    'the', 'a', 'an', 'and', 'of', 'to', 'in', 'is', 'that', 'for', 'be', 'you', 'he', 'it', 'all', 'with',
    'my', 'your', 'his', 'not', 'by', 'are', 'i', 'me', 'us', 'we', 'as', 'on', 'but',
  ].map(fold),
)

export function isContentWord(t: Token): boolean {
  return t.key.length > 2 && !FILLERS.has(t.key)
}
