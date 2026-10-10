import { useRef, useState } from 'react'
import { motion, LayoutGroup } from 'motion/react'
import type { OrderEx } from '../lib/exercises'
import type { ExProps } from './types'

/** Arrange the phrases – rebuilds the verse's structure with strong cues. */
export default function Order({ ex, lang, api, solved, reference }: ExProps<OrderEx>) {
  const [placed, setPlaced] = useState<number[]>([])
  const [shake, setShake] = useState<number | null>(null)
  const errors = useRef(0)

  const tap = (i: number) => {
    if (solved || placed.includes(i)) return
    if (i === placed.length) {
      api.correct()
      const next = [...placed, i]
      setPlaced(next)
      if (next.length === ex.chunks.length) api.done({ errors: errors.current, items: ex.chunks.length })
    } else {
      errors.current++
      api.wrong()
      setShake(i)
      setTimeout(() => setShake(null), 420)
    }
  }

  return (
    <div className="ex">
      <div className="ex-title">
        <span className="ex-kicker">{reference}</span>
        <h2 className="ex-q">{lang === 'de' ? 'Bring die Teile in die richtige Reihenfolge.' : 'Put the pieces in order.'}</h2>
      </div>
      <LayoutGroup>
        <div className={`order-answer serif ${solved ? 'is-solved' : ''}`}>
          {placed.map((i, k) => (
            <motion.span
              layoutId={`${ex.id}-${i}`}
              key={i}
              className="order-placed"
              transition={{ type: 'spring', stiffness: 520, damping: 34 }}
              animate={solved ? { color: ['var(--ink)', 'var(--moss)', 'var(--ink)'] } : undefined}
              style={{ transitionDelay: `${k * 40}ms` }}
            >
              {ex.chunks[i]}
            </motion.span>
          ))}
          {!solved && <span className="order-caret" />}
        </div>
        <div className="order-pool">
          {ex.shuffled.map((i) =>
            placed.includes(i) ? (
              <span key={i} className="tile tile-ghost">{ex.chunks[i]}</span>
            ) : (
              <motion.button
                layoutId={`${ex.id}-${i}`}
                key={i}
                className={`tile ${shake === i ? 'is-wrong' : ''}`}
                onClick={() => tap(i)}
                whileTap={{ scale: 0.96 }}
                animate={shake === i ? { x: [0, -7, 6, -4, 3, 0] } : { x: 0 }}
                transition={{ type: 'spring', stiffness: 520, damping: 34, x: { duration: 0.38 } }}
              >
                {ex.chunks[i]}
              </motion.button>
            ),
          )}
        </div>
      </LayoutGroup>
    </div>
  )
}
