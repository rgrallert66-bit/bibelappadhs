import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { LettersEx } from '../lib/exercises'
import { firstLetterMatches } from '../lib/text'
import type { ExProps } from './types'
import Keyboard, { type KeyFlash } from '../components/Keyboard'
import Icon from '../components/Icon'

/**
 * First-letter recall: type the initial of each word. Proven for verbatim text
 * memorisation – it forces retrieval of every word while keeping the pace high.
 */
export default function Letters({ ex, lang, api, solved, reference }: ExProps<LettersEx>) {
  const [idx, setIdx] = useState(0)
  const [helped, setHelped] = useState<Set<number>>(new Set())
  const [flash, setFlash] = useState<KeyFlash>(null)
  const [shake, setShake] = useState(0)
  const attempts = useRef(0)
  const errored = useRef<Set<number>>(new Set())
  const flowRef = useRef<HTMLDivElement>(null)
  const n = ex.tokens.length

  const advance = useCallback(
    (asHelped: boolean) => {
      if (asHelped) setHelped((h) => new Set(h).add(idx))
      attempts.current = 0
      const next = idx + 1
      setIdx(next)
      if (next === n) api.done({ errors: errored.current.size, items: n })
    },
    [idx, n, api],
  )

  const press = useCallback(
    (k: string) => {
      if (solved || idx >= n) return
      const ok = firstLetterMatches(k, ex.tokens[idx])
      setFlash({ key: k, ok, n: Date.now() })
      if (ok) {
        api.correct()
        advance(false)
      } else {
        api.wrong()
        errored.current.add(idx)
        attempts.current++
        setShake((s) => s + 1)
        if (attempts.current >= 3) advance(true)
      }
    },
    [solved, idx, n, ex.tokens, api, advance],
  )

  const hint = () => {
    if (solved || idx >= n) return
    errored.current.add(idx)
    api.wrong()
    advance(true)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (/^\p{L}$/u.test(e.key)) {
        e.preventDefault()
        press(e.key.toLowerCase())
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  useEffect(() => {
    const el = flowRef.current?.querySelector('.is-current')
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [idx])

  const title =
    ex.hint === 1
      ? lang === 'de' ? 'Tippe den Anfangsbuchstaben jedes Wortes.' : 'Type the first letter of each word.'
      : ex.hint === 2
        ? lang === 'de' ? 'Jetzt nur noch mit Wortformen.' : 'Now with word shapes only.'
        : lang === 'de' ? 'Ganz aus dem Herzen.' : 'Completely by heart.'

  return (
    <div className="ex ex-letters">
      <div className="ex-title">
        <span className="ex-kicker">{reference}{ex.hint === 3 ? ' · ' + (lang === 'de' ? 'ohne Hilfe' : 'no help') : ''}</span>
        <h2 className="ex-q">{title}</h2>
      </div>
      <div className={`verse-flow serif letters-flow hint-${ex.hint} ${solved ? 'wave' : ''}`} ref={flowRef}>
        {ex.tokens.map((t, i) => {
          const revealed = i < idx
          const current = i === idx && !solved
          if (!revealed && ex.hint === 3 && !current) return null
          return (
            <span key={i} className={`w ${current ? 'is-current' : ''}`} style={{ ['--i' as string]: i }}>
              {revealed ? (
                <motion.span
                  className={`lw ${helped.has(i) ? 'is-helped' : ''}`}
                  initial={{ opacity: 0, y: 5, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  {t.raw}
                </motion.span>
              ) : current ? (
                <motion.span key={shake} className="lw-current" animate={shake ? { x: [0, -5, 4, -2, 0] } : undefined} transition={{ duration: 0.3 }}>
                  {ex.hint === 1 ? <span className="ghost">{t.raw}</span> : ex.hint === 2 ? <span className="bar" style={{ width: `${Math.max(0.9, t.word.length * 0.52)}em` }} /> : <span className="caret" />}
                </motion.span>
              ) : ex.hint === 1 ? (
                <span className="ghost">{t.raw}</span>
              ) : (
                <span className="bar" style={{ width: `${Math.max(0.9, t.word.length * 0.52)}em` }} />
              )}{' '}
            </span>
          )
        })}
      </div>
      <div className="letters-foot">
        <div className="letters-progress" aria-hidden>
          <motion.div className="letters-progress-fill" animate={{ scaleX: idx / n }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
        </div>
        <button className="hint-btn" onClick={hint} disabled={solved} aria-label={lang === 'de' ? 'Nächstes Wort zeigen' : 'Show next word'}>
          <Icon name="eye" size={18} />
          <span>{lang === 'de' ? 'Wort zeigen' : 'Show word'}</span>
        </button>
      </div>
      <Keyboard lang={lang} onKey={press} flash={flash} disabled={solved} />
    </div>
  )
}
