import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { ChainEx } from '../lib/exercises'
import type { ExProps } from './types'

/** Word chain – build the verse word by word in a quick rhythm. */
export default function Chain({ ex, lang, api, solved, reference }: ExProps<ChainEx>) {
  const [pos, setPos] = useState(ex.given)
  const [wrong, setWrong] = useState<string[]>([])
  const errors = useRef(0)
  const flowRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    flowRef.current?.scrollTo({ top: flowRef.current.scrollHeight, behavior: 'smooth' })
  }, [pos])

  const choose = (w: string) => {
    if (solved || pos >= ex.tokens.length) return
    if (w === ex.tokens[pos].word) {
      api.correct()
      setWrong([])
      const next = pos + 1
      setPos(next)
      if (next === ex.tokens.length) api.done({ errors: errors.current, items: ex.tokens.length - ex.given })
    } else {
      errors.current++
      api.wrong()
      setWrong((x) => [...x, w])
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= 3 && ex.options[pos]?.[n - 1]) choose(ex.options[pos][n - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="ex">
      <div className="ex-title">
        <span className="ex-kicker">{reference}</span>
        <h2 className="ex-q">{lang === 'de' ? 'Wie geht es weiter?' : 'What comes next?'}</h2>
      </div>
      <p className="verse-flow serif chain-flow" ref={flowRef}>
        {ex.tokens.slice(0, pos).map((t, i) => (
          <motion.span
            key={i}
            className="w"
            initial={i >= ex.given ? { opacity: 0, y: 8, filter: 'blur(4px)' } : false}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.raw}{' '}
          </motion.span>
        ))}
        {!solved && <span className="chain-caret" />}
      </p>
      <div className="options options-chain">
        <AnimatePresence mode="popLayout" initial={false}>
          {pos < ex.tokens.length &&
            ex.options[pos].map((o) => {
              const isWrong = wrong.includes(o)
              return (
                <motion.button
                  key={`${pos}-${o}`}
                  className={`opt opt-big ${isWrong ? 'is-wrong' : ''}`}
                  onClick={() => !isWrong && choose(o)}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={isWrong ? { opacity: 0.4, x: [0, -6, 5, -3, 0], scale: 1 } : { opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.22 }}
                  disabled={isWrong}
                >
                  {o}
                </motion.button>
              )
            })}
        </AnimatePresence>
      </div>
    </div>
  )
}
