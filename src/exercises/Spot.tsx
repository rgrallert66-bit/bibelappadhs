import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { SpotEx } from '../lib/exercises'
import type { ExProps } from './types'

/** Find the intruder – one word was swapped. Sharpens precise recall. */
export default function Spot({ ex, lang, api, solved, reference }: ExProps<SpotEx>) {
  const [found, setFound] = useState(false)
  const [miss, setMiss] = useState<number[]>([])
  const errors = useRef(0)

  const tap = (i: number) => {
    if (solved || found) return
    if (i === ex.wrongIndex) {
      api.correct()
      setFound(true)
      setTimeout(() => api.done({ errors: errors.current, items: 3 }), 650)
    } else if (!miss.includes(i)) {
      errors.current++
      api.wrong()
      const m = [...miss, i]
      setMiss(m)
      if (m.length >= 2) {
        // reveal after two misses – learning beats frustration
        setFound(true)
        setTimeout(() => api.done({ errors: errors.current, items: 3 }), 1100)
      }
    }
  }

  return (
    <div className="ex">
      <div className="ex-title">
        <span className="ex-kicker">{reference}</span>
        <h2 className="ex-q">{lang === 'de' ? 'Ein Wort stimmt nicht. Tippe es an.' : 'One word is wrong. Tap it.'}</h2>
      </div>
      <p className="verse-flow serif spot-flow">
        {ex.tokens.map((t, i) => {
          const isTarget = i === ex.wrongIndex
          const missed = miss.includes(i)
          return (
            <span key={i} className="w">
              {t.pre}
              <motion.button
                className={`spot-word ${missed ? 'is-miss' : ''} ${found && isTarget ? 'is-found' : ''}`}
                onClick={() => tap(i)}
                animate={missed ? { x: [0, -5, 4, -2, 0] } : undefined}
                transition={{ duration: 0.35 }}
              >
                {isTarget ? (
                  found ? (
                    <span className="swap">
                      <motion.s initial={{ opacity: 1 }} animate={{ opacity: 0.45 }}>{ex.wrongWord}</motion.s>{' '}
                      <motion.span className="swap-in" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 24 }}>
                        {t.word}
                      </motion.span>
                    </span>
                  ) : (
                    ex.wrongWord
                  )
                ) : (
                  t.word
                )}
              </motion.button>
              {t.post}{' '}
            </span>
          )
        })}
      </p>
    </div>
  )
}
