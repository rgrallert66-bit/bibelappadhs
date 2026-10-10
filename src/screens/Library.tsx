import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useStore, allVerses } from '../store'
import { PATHS, reference, type Verse } from '../data/verses'
import { stageOf, STAGE_NAMES } from '../lib/fsrs'
import { dayKey, daysBetween } from '../lib/dates'
import { useLang } from '../lib/i18n'
import StageGlyph from '../components/StageGlyph'
import Icon from '../components/Icon'

export function dueLabel(due: string | undefined, lang: 'de' | 'en'): string {
  if (!due) return lang === 'de' ? 'noch nicht gepflanzt' : 'not planted yet'
  const d = daysBetween(dayKey(), due)
  if (d <= 0) return lang === 'de' ? 'heute gießen' : 'water today'
  if (d === 1) return lang === 'de' ? 'morgen' : 'tomorrow'
  if (d < 30) return lang === 'de' ? `in ${d} Tagen` : `in ${d} days`
  const m = Math.round(d / 30)
  return lang === 'de' ? `in ${m} ${m === 1 ? 'Monat' : 'Monaten'}` : `in ${m} month${m === 1 ? '' : 's'}`
}

export default function Library({ onVerse, onAdd }: { onVerse: (id: string) => void; onAdd: () => void }) {
  const lang = useLang()
  const s = useStore()
  const verses = allVerses(s.custom)
  const memory = s.memory[s.translation]
  const [open, setOpen] = useState<string | null>(() => {
    const firstQueued = PATHS.find((p) => p.verses.some((id) => !memory[id]))
    return firstQueued?.id ?? PATHS[0].id
  })
  const custom = s.custom.filter((v) => v.custom?.translation === s.translation)
  const planted = Object.keys(memory).length

  const row = (v: Verse, i: number) => {
    const m = memory[v.id]
    const stage = stageOf(m)
    const queuePos = s.queue.indexOf(v.id)
    return (
      <motion.button
        key={v.id}
        className="vrow"
        onClick={() => onVerse(v.id)}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.025, duration: 0.3 }}
        whileTap={{ scale: 0.985 }}
      >
        <div className={`vrow-glyph ${m ? '' : 'is-seed'}`}>
          <StageGlyph stage={stage} size={30} />
        </div>
        <div className="vrow-main">
          <div className="vrow-ref">{reference(v, s.translation)}</div>
          <div className="vrow-text serif">{v.text[s.translation]}</div>
        </div>
        <div className="vrow-meta">
          {m ? (
            <span className={`vrow-due ${m.due <= dayKey() ? 'is-due' : ''}`}>{dueLabel(m.due, lang)}</span>
          ) : queuePos === 0 ? (
            <span className="vrow-due is-next">{lang === 'de' ? 'als Nächstes' : 'up next'}</span>
          ) : null}
        </div>
      </motion.button>
    )
  }

  return (
    <div className="screen library">
      <header className="lib-head">
        <div className="eyebrow">{lang === 'de' ? 'Dein Garten' : 'Your garden'}</div>
        <h1 className="h1">{lang === 'de' ? 'Verse' : 'Verses'}</h1>
        <p className="muted lib-sub">
          {lang === 'de'
            ? `${planted} gepflanzt · Neue Verse kommen in der Reihenfolge deiner Pfade.`
            : `${planted} planted · New verses follow the order of your paths.`}
        </p>
      </header>

      {PATHS.map((p) => {
        const list = p.verses.map((id) => verses[id]).filter(Boolean)
        const done = list.filter((v) => memory[v.id]).length
        const isOpen = open === p.id
        const stageSum = list.reduce((a, v) => a + stageOf(memory[v.id]), 0)
        const pct = stageSum / (list.length * 5)
        return (
          <section key={p.id} className={`path card ${isOpen ? 'is-open' : ''}`} style={{ ['--hue' as string]: p.hue }}>
            <button className="path-head" onClick={() => setOpen(isOpen ? null : p.id)} aria-expanded={isOpen}>
              <div className="path-medal">
                <svg viewBox="0 0 44 44" width="44" height="44">
                  <circle cx="22" cy="22" r="19" fill="none" stroke="var(--line-2)" strokeWidth="3" />
                  <circle cx="22" cy="22" r="19" fill="none" stroke="var(--path-c)" strokeWidth="3" strokeLinecap="round" strokeDasharray={119.4} strokeDashoffset={119.4 * (1 - pct)} transform="rotate(-90 22 22)" />
                </svg>
                <span className="path-count">{done}</span>
              </div>
              <div className="grow" style={{ textAlign: 'left' }}>
                <div className="path-title serif">{p.title[s.translation]}</div>
                <div className="path-sub">{p.subtitle[s.translation]} · {done}/{list.length}</div>
              </div>
              <motion.span animate={{ rotate: isOpen ? 90 : 0 }} className="faint">
                <Icon name="chevron" size={20} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  className="path-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {list.map(row)}
                  {done < list.length && (
                    <button className="path-plant" onClick={() => s.enqueuePath(p.id)}>
                      <Icon name="seed" size={16} />
                      {lang === 'de' ? 'Diesen Pfad als Nächstes lernen' : 'Learn this path next'}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )
      })}

      <section className="path card">
        <div className="path-head" style={{ cursor: 'default' }}>
          <div className="path-medal">
            <Icon name="heart" size={22} style={{ color: 'var(--rose)' }} />
          </div>
          <div className="grow">
            <div className="path-title serif">{lang === 'de' ? 'Eigene Verse' : 'Your own verses'}</div>
            <div className="path-sub">{lang === 'de' ? 'Aus deiner eigenen Bibel' : 'From your own Bible'}</div>
          </div>
        </div>
        <div className="path-body">
          {custom.map(row)}
          <button className="path-plant" onClick={onAdd}>
            <Icon name="plus" size={16} />
            {lang === 'de' ? 'Vers hinzufügen' : 'Add a verse'}
          </button>
        </div>
      </section>

      <div className="legend">
        {([1, 2, 3, 4, 5] as const).map((st) => (
          <div key={st} className="legend-item">
            <StageGlyph stage={st} size={22} />
            <span>{STAGE_NAMES[st][lang]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
