import { useEffect, useState } from 'react'
import { motion, AnimatePresence, animate } from 'motion/react'
import { PATHS, type TranslationId } from '../data/verses'
import { GOALS, type DailyGoal } from '../lib/session'
import TreeCanvas from '../components/TreeCanvas'
import { season } from '../lib/dates'
import { primeAudio, sfx, haptic } from '../lib/feedback'
import Icon from '../components/Icon'
import { skyFor } from './Home'
import { useTheme } from '../lib/theme'

interface Props {
  onDone: (p: { translation: TranslationId; goal: DailyGoal; path: string }) => void
}

const ease = [0.22, 1, 0.36, 1] as const

export default function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState(0)
  const [translation, setTranslation] = useState<TranslationId>('elb')
  const [goal, setGoal] = useState<DailyGoal>('normal')
  const [path, setPath] = useState('wurzeln')
  const [age, setAge] = useState(0.4)
  const dark = useTheme()
  const de = translation === 'elb'

  useEffect(() => {
    const c = animate(0.4, 140, { duration: 7, ease: [0.3, 0, 0.2, 1], delay: 0.6, onUpdate: setAge })
    return () => c.stop()
  }, [])

  const go = (n: number) => {
    primeAudio()
    sfx.place()
    haptic.tap()
    setStep(n)
  }

  return (
    <div className="onb">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="s0" className="onb-step onb-welcome" exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <div className="onb-tree">
              <TreeCanvas age={age} fruits={[]} golden={0} season={season()} sky={skyFor(dark)} compact />
              <div className="onb-fade" />
            </div>
            <motion.div className="onb-copy" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8, ease }}>
              <h1 className="onb-title serif">Scripture</h1>
              <p className="onb-tag serif">Gottes Wort. Im Herzen bewahrt.</p>
              <p className="onb-body muted">Ein paar Minuten am Tag. Ein Baum, der mit dir wächst – Vers für Vers, Tag für Tag.</p>
            </motion.div>
            <motion.div className="onb-actions" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7, ease }}>
              <button className="btn block" onClick={() => go(1)}>
                Los geht’s <Icon name="chevron" size={18} stroke={2.4} />
              </button>
            </motion.div>
          </motion.div>
        )}

        {step === 1 && (
          <Step key="s1" kicker="1 / 3" title="Welche Bibel liegt dir am Herzen?" sub="Which Bible would you like to learn from?" onBack={() => setStep(0)}>
            <div className="choice-list">
              {([
                { id: 'elb', name: 'Elberfelder Bibel', meta: 'Deutsch · Revision 2006', note: 'Wortgetreu und präzise' },
                { id: 'nkjv', name: 'New King James Version', meta: 'English · NKJV', note: 'Classic, faithful, readable' },
              ] as const).map((o) => (
                <Choice key={o.id} on={translation === o.id} onClick={() => setTranslation(o.id)}>
                  <div className="choice-title serif">{o.name}</div>
                  <div className="choice-meta">{o.meta}</div>
                  <div className="choice-note">{o.note}</div>
                </Choice>
              ))}
            </div>
            <button className="btn block" onClick={() => go(2)}>{de ? 'Weiter' : 'Continue'}</button>
          </Step>
        )}

        {step === 2 && (
          <Step key="s2" kicker="2 / 3" title={de ? 'Dein täglicher Rhythmus' : 'Your daily rhythm'} sub={de ? 'Wenige Minuten jeden Tag schlagen eine Stunde am Sonntag.' : 'A few minutes daily beat an hour on Sunday.'} onBack={() => setStep(1)}>
            <div className="choice-list">
              {(Object.keys(GOALS) as DailyGoal[]).map((g) => (
                <Choice key={g} on={goal === g} onClick={() => setGoal(g)}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <div className="choice-title serif">{de ? GOALS[g].label : GOALS[g].labelEn}</div>
                      <div className="choice-note">
                        {g === 'light' && (de ? 'Ideal zum Einstieg' : 'Perfect to begin')}
                        {g === 'normal' && (de ? 'Empfohlen – stetiges Wachstum' : 'Recommended – steady growth')}
                        {g === 'deep' && (de ? 'Für Hungrige' : 'For the hungry')}
                      </div>
                    </div>
                    <div className="choice-min"><strong>{GOALS[g].minutes}</strong> min</div>
                  </div>
                </Choice>
              ))}
            </div>
            <button className="btn block" onClick={() => go(3)}>{de ? 'Weiter' : 'Continue'}</button>
          </Step>
        )}

        {step === 3 && (
          <Step key="s3" kicker="3 / 3" title={de ? 'Wo möchtest du beginnen?' : 'Where would you like to start?'} sub={de ? 'Du kannst jederzeit weitere Pfade öffnen.' : 'You can open more paths at any time.'} onBack={() => setStep(2)}>
            <div className="choice-list">
              {PATHS.map((p) => (
                <Choice key={p.id} on={path === p.id} onClick={() => setPath(p.id)} hue={p.hue}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <div className="choice-title serif">{p.title[translation]}</div>
                      <div className="choice-note">{p.subtitle[translation]}</div>
                    </div>
                    <div className="choice-min"><strong>{p.verses.length}</strong> {de ? 'Verse' : 'verses'}</div>
                  </div>
                </Choice>
              ))}
            </div>
            <button
              className="btn block"
              onClick={() => {
                primeAudio()
                haptic.success()
                onDone({ translation, goal, path })
              }}
            >
              <Icon name="seed" size={18} />
              {de ? 'Ersten Vers pflanzen' : 'Plant your first verse'}
            </button>
          </Step>
        )}
      </AnimatePresence>
    </div>
  )
}

function Step({ kicker, title, sub, children, onBack }: { kicker: string; title: string; sub: string; children: React.ReactNode; onBack: () => void }) {
  return (
    <motion.div
      className="onb-step"
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -28 }}
      transition={{ duration: 0.4, ease }}
    >
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
        <button className="icon-btn" onClick={onBack} aria-label="Zurück">
          <Icon name="back" size={22} />
        </button>
        <span className="eyebrow">{kicker}</span>
        <span style={{ width: 40 }} />
      </div>
      <h1 className="h1 onb-h">{title}</h1>
      <p className="muted onb-sub">{sub}</p>
      {children}
    </motion.div>
  )
}

function Choice({ on, onClick, children, hue }: { on: boolean; onClick: () => void; children: React.ReactNode; hue?: number }) {
  return (
    <motion.button
      className={`choice ${on ? 'is-on' : ''}`}
      onClick={() => {
        sfx.tap()
        haptic.tap()
        onClick()
      }}
      whileTap={{ scale: 0.98 }}
      style={hue !== undefined ? ({ ['--hue' as string]: hue } as React.CSSProperties) : undefined}
      role="radio"
      aria-checked={on}
    >
      <div className="grow" style={{ textAlign: 'left' }}>{children}</div>
      <span className="choice-radio">
        <AnimatePresence>
          {on && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 600, damping: 26 }}>
              <Icon name="check" size={14} stroke={3.2} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  )
}
