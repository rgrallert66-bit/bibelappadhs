import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { IntroEx } from '../lib/exercises'
import type { ExProps } from './types'
import { sfx, haptic } from '../lib/feedback'

/** Discover the verse phrase by phrase – chunked encoding, reading aloud encouraged. */
export default function Intro({ ex, reference, lang, api, solved }: ExProps<IntroEx>) {
  const [shown, setShown] = useState(1)
  const all = shown >= ex.chunks.length

  const next = () => {
    if (solved) return
    if (!all) {
      sfx.place()
      haptic.tap()
      setShown((n) => n + 1)
    }
  }

  useEffect(() => {
    if (all && !solved) {
      const t = setTimeout(() => api.done({ errors: 0, items: 0 }), 450)
      return () => clearTimeout(t)
    }
  }, [all, solved, api])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="ex ex-intro" onClick={next} role="button" tabIndex={0} aria-label={lang === 'de' ? 'Weiterlesen' : 'Continue reading'}>
      <div className="ex-title">
        <span className="ex-kicker">{lang === 'de' ? 'Neuer Vers' : 'New verse'}</span>
        <h2 className="ex-q">{lang === 'de' ? 'Lies mit – am besten halblaut.' : 'Read along – ideally out loud.'}</h2>
      </div>
      <div className="intro-verse serif">
        {ex.chunks.map((c, i) => (
          <motion.span
            key={i}
            className="intro-chunk"
            initial={false}
            animate={i < shown ? { opacity: 1, filter: 'blur(0px)', y: 0 } : { opacity: 0.08, filter: 'blur(6px)', y: 4 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {c}{' '}
          </motion.span>
        ))}
      </div>
      <motion.div className="intro-ref" initial={{ opacity: 0, y: 6 }} animate={{ opacity: all ? 1 : 0, y: all ? 0 : 6 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <span className="ref-line" />
        {reference}
      </motion.div>
      {!all && (
        <motion.div className="tap-hint" animate={{ opacity: [0.35, 0.85, 0.35] }} transition={{ repeat: Infinity, duration: 2.4 }}>
          {lang === 'de' ? 'Tippe, um weiterzulesen' : 'Tap to continue'}
        </motion.div>
      )}
    </div>
  )
}
