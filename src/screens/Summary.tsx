import { useEffect, useState } from 'react'
import { motion, animate } from 'motion/react'
import { useStore, allVerses, todayQuestProgress } from '../store'
import { reference } from '../data/verses'
import { ACHIEVEMENTS } from '../data/goals'
import { STAGE_NAMES } from '../lib/fsrs'
import { useLang } from '../lib/i18n'
import StageGlyph from '../components/StageGlyph'
import Icon from '../components/Icon'
import type { SessionOutcome } from './Session'

const ease = [0.22, 1, 0.36, 1] as const

function Counter({ to, suffix = '', delay = 0 }: { to: number; suffix?: string; delay?: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const c = animate(0, to, { duration: 1.1, delay, ease: [0.16, 1, 0.3, 1], onUpdate: (x) => setV(Math.round(x)) })
    return () => c.stop()
  }, [to, delay])
  return <>{v}{suffix}</>
}

export interface SummaryProps {
  outcome: SessionOutcome
  newDay: boolean
  golden: boolean
  newAchievements: string[]
  onClose: () => void
}

export default function Summary({ outcome, newDay, golden, newAchievements, onClose }: SummaryProps) {
  const lang = useLang()
  const s = useStore()
  const verses = allVerses(s.custom)
  const { stats } = outcome
  const acc = stats.items ? Math.round((1 - stats.errors / stats.items) * 100) : 100
  const secs = Math.round(stats.ms / 1000)
  const quests = todayQuestProgress(s)
  const dayN = s.learnDays.length

  const title = newDay
    ? lang === 'de' ? `Tag ${dayN} vollendet` : `Day ${dayN} complete`
    : lang === 'de' ? 'Gut geübt' : 'Well practised'

  const line = newDay
    ? lang === 'de' ? 'Dein Baum wächst heute ein Stück.' : 'Your tree grows a little today.'
    : lang === 'de' ? 'Jede Wiederholung macht die Wurzeln tiefer.' : 'Every review deepens the roots.'

  return (
    <motion.div className="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <div className="summary-inner">
        <motion.div className="summary-emblem" initial={{ scale: 0.4, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}>
          <div className="emblem-rays" />
          <Icon name={newDay ? 'leaf' : 'drop'} size={40} stroke={1.8} />
        </motion.div>
        <motion.h1 className="h1 summary-title" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6, ease }}>
          {title}
        </motion.h1>
        <motion.p className="muted summary-line" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          {line}
        </motion.p>

        <div className="summary-stats">
          {[
            { v: acc, suf: '%', l: lang === 'de' ? 'Treffsicher' : 'Accuracy' },
            { v: stats.maxCombo, suf: '', l: lang === 'de' ? 'Beste Serie' : 'Best run' },
            { v: Math.max(1, Math.round(secs / 60)), suf: ' min', l: lang === 'de' ? 'Zeit' : 'Time' },
          ].map((x, i) => (
            <motion.div key={x.l} className="sstat" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08, duration: 0.5, ease }}>
              <strong className="serif"><Counter to={x.v} suffix={x.suf} delay={0.55 + i * 0.08} /></strong>
              <span>{x.l}</span>
            </motion.div>
          ))}
        </div>

        {outcome.changes.length > 0 && (
          <motion.section className="card summary-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.5, ease }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>{lang === 'de' ? 'Deine Verse' : 'Your verses'}</div>
            {outcome.changes.map((c, i) => {
              const v = verses[c.verseId]
              if (!v) return null
              const grew = c.after > c.before
              return (
                <motion.div key={c.verseId + i} className="schange" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.85 + i * 0.07 }}>
                  <StageGlyph stage={c.after} size={30} />
                  <div className="grow">
                    <div className="schange-ref">{reference(v, s.translation)}</div>
                    <div className="schange-st">
                      {c.before === 0 ? (
                        <strong>{lang === 'de' ? 'Neu gepflanzt' : 'Newly planted'}</strong>
                      ) : grew ? (
                        <>
                          {STAGE_NAMES[c.before][lang]} <Icon name="chevron" size={12} /> <strong>{STAGE_NAMES[c.after][lang]}</strong>
                        </>
                      ) : (
                        <>{STAGE_NAMES[c.after][lang]} · {lang === 'de' ? 'gegossen' : 'watered'}</>
                      )}
                    </div>
                  </div>
                  {grew && <span className="schange-up"><Icon name="sparkle" size={16} fill stroke={0} /></span>}
                </motion.div>
              )
            })}
          </motion.section>
        )}

        <motion.section className="card summary-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.5, ease }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{lang === 'de' ? 'Tagesziele' : 'Daily goals'}</div>
          {quests.map((q, i) => (
            <div key={q.id} className="sq">
              <span className={`sq-check ${q.done ? 'is-done' : ''}`}>{q.done && <Icon name="check" size={13} stroke={3.2} />}</span>
              <span className="grow">{lang === 'de' ? q.de : q.en}</span>
              <div className="sq-bar">
                <motion.div className="sq-fill" initial={{ scaleX: 0 }} animate={{ scaleX: q.value / q.target }} transition={{ delay: 1.05 + i * 0.1, duration: 0.8, ease }} />
              </div>
            </div>
          ))}
          {golden && (
            <motion.div className="golden-note" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5, type: 'spring', stiffness: 300, damping: 20 }}>
              <Icon name="leaf" size={18} fill stroke={0} />
              {lang === 'de' ? 'Ein goldenes Blatt für deinen Baum.' : 'A golden leaf for your tree.'}
            </motion.div>
          )}
        </motion.section>

        {newAchievements.length > 0 && (
          <motion.section className="card summary-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15, duration: 0.5, ease }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>{lang === 'de' ? 'Neuer Meilenstein' : 'New milestone'}</div>
            <div className="ach-new">
              {newAchievements.map((id, i) => {
                const a = ACHIEVEMENTS.find((x) => x.id === id)!
                return (
                  <motion.div key={id} className="medal is-got" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.3 + i * 0.15, type: 'spring', stiffness: 380, damping: 14 }}>
                    <div className="medal-disc"><Icon name={a.glyph} size={22} /></div>
                    <span className="medal-name">{lang === 'de' ? a.de : a.en}</span>
                    <span className="medal-desc">{lang === 'de' ? a.descDe : a.descEn}</span>
                  </motion.div>
                )
              })}
            </div>
          </motion.section>
        )}
      </div>
      <motion.div className="summary-foot" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.5, ease }}>
        <button className={`btn block ${newDay ? 'gold' : ''}`} onClick={onClose}>
          {newDay ? (lang === 'de' ? 'Baum wachsen sehen' : 'Watch your tree grow') : lang === 'de' ? 'Zurück zum Garten' : 'Back to the garden'}
        </button>
      </motion.div>
    </motion.div>
  )
}
