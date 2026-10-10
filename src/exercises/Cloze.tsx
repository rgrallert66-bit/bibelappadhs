import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { ClozeEx } from '../lib/exercises'
import type { ExProps } from './types'

/** Fill the gaps – cued recall of the key words. */
export default function Cloze({ ex, lang, api, solved, reference }: ExProps<ClozeEx>) {
  const [step, setStep] = useState(0)
  const [wrong, setWrong] = useState<string[]>([])
  const errors = useRef(0)
  const gapIndex = ex.gaps[step]

  const choose = (word: string) => {
    if (solved || step >= ex.gaps.length) return
    if (word === ex.tokens[gapIndex].word) {
      api.correct()
      setWrong([])
      const next = step + 1
      setStep(next)
      if (next === ex.gaps.length) api.done({ errors: errors.current, items: ex.gaps.length })
    } else {
      errors.current++
      api.wrong()
      setWrong((w) => [...w, word])
    }
  }

  return (
    <div className="ex">
      <div className="ex-title">
        <span className="ex-kicker">{reference}</span>
        <h2 className="ex-q">{lang === 'de' ? 'Welches Wort fehlt?' : 'Which word is missing?'}</h2>
      </div>
      <p className="verse-flow serif">
        {ex.tokens.map((t, i) => {
          const g = ex.gaps.indexOf(i)
          if (g === -1) return <span key={i} className="w">{t.raw} </span>
          const filled = g < step
          const active = g === step && !solved
          return (
            <span key={i} className="w">
              {t.pre}
              {filled ? (
                <motion.span
                  className="gap-word"
                  initial={{ opacity: 0, y: -10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                >
                  {t.word}
                </motion.span>
              ) : (
                <span className={`gap ${active ? 'is-active' : ''}`} style={{ minWidth: `${Math.max(2.2, t.word.length * 0.55)}em` }} />
              )}
              {t.post}{' '}
            </span>
          )
        })}
      </p>
      <div className="options">
        {step < ex.gaps.length &&
          ex.options[step].map((o) => {
            const isWrong = wrong.includes(o)
            return (
              <motion.button
                key={`${step}-${o}`}
                className={`opt ${isWrong ? 'is-wrong' : ''}`}
                onClick={() => !isWrong && choose(o)}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, y: 8 }}
                animate={isWrong ? { opacity: 0.45, x: [0, -6, 5, -3, 0] } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                disabled={isWrong}
              >
                {o}
              </motion.button>
            )
          })}
      </div>
    </div>
  )
}
