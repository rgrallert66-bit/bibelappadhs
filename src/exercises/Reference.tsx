import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { ReferenceEx } from '../lib/exercises'
import type { ExProps } from './types'
import { useStore, allVerses } from '../store'
import { reference as refOf } from '../data/verses'

const opening = (text: string, n = 7) => {
  const words = text.split(/\s+/)
  return words.slice(0, n).join(' ') + (words.length > n ? ' …' : '')
}

/** Connect words and address – the reference becomes a retrieval cue. */
export default function Reference({ ex, verse, lang, api, solved }: ExProps<ReferenceEx>) {
  const translation = useStore((s) => s.translation)
  const custom = useStore((s) => s.custom)
  const verses = allVerses(custom)
  const [picked, setPicked] = useState<string | null>(null)
  const [wrong, setWrong] = useState<string[]>([])
  const errors = useRef(0)

  const choose = (id: string) => {
    if (solved || picked) return
    if (id === verse.id) {
      api.correct()
      setPicked(id)
      setTimeout(() => api.done({ errors: errors.current, items: 2 }), 500)
    } else {
      errors.current++
      api.wrong()
      setWrong((w) => [...w, id])
    }
  }

  return (
    <div className="ex">
      <div className="ex-title">
        <span className="ex-kicker">{lang === 'de' ? 'Fundstelle' : 'Reference'}</span>
        <h2 className="ex-q">
          {ex.mode === 'toRef'
            ? lang === 'de' ? 'Wo steht dieser Vers?' : 'Where is this verse found?'
            : lang === 'de' ? 'Welcher Vers steht hier?' : 'Which verse is this?'}
        </h2>
      </div>
      <div className="ref-prompt serif">
        {ex.mode === 'toRef' ? <p className="verse-flow">{opening(verse.text[translation], 14)}</p> : <p className="ref-big">{refOf(verse, translation)}</p>}
      </div>
      <div className="options options-col">
        {ex.options.map((id) => {
          const v = verses[id]
          if (!v) return null
          const isWrong = wrong.includes(id)
          const isRight = picked === id
          return (
            <motion.button
              key={id}
              className={`opt opt-wide ${isWrong ? 'is-wrong' : ''} ${isRight ? 'is-right' : ''} ${ex.mode === 'toText' ? 'serif' : ''}`}
              onClick={() => !isWrong && choose(id)}
              whileTap={{ scale: 0.97 }}
              animate={isWrong ? { opacity: 0.45, x: [0, -6, 5, -3, 0] } : { opacity: 1 }}
              transition={{ duration: 0.3 }}
              disabled={isWrong}
            >
              {ex.mode === 'toRef' ? refOf(v, translation) : opening(v.text[translation])}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
