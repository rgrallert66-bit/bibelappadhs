import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore, allVerses } from './store'
import { buildSession, type SessionPlan } from './lib/session'
import { dayKey } from './lib/dates'
import { useLang } from './lib/i18n'
import { useTheme } from './lib/theme'
import Home from './screens/Home'
import Library from './screens/Library'
import Profile from './screens/Profile'
import Session, { type SessionOutcome } from './screens/Session'
import Summary from './screens/Summary'
import Onboarding from './screens/Onboarding'
import VerseSheet from './screens/VerseSheet'
import AddVerse from './screens/AddVerse'
import Icon from './components/Icon'
import './styles/session.css'
import './styles/screens.css'

type Tab = 'home' | 'verses' | 'me'

interface Finished {
  outcome: SessionOutcome
  newDay: boolean
  golden: boolean
  newAchievements: string[]
}

export default function App() {
  useTheme()
  const lang = useLang()
  const s = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [plan, setPlan] = useState<SessionPlan | null>(null)
  const [finished, setFinished] = useState<Finished | null>(null)
  const [sheet, setSheet] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const today = dayKey()
  const makePlan = (mode: 'daily' | 'practice', focusVerse?: string, override?: Partial<Parameters<typeof buildSession>[0]>) => {
    const st = useStore.getState()
    return buildSession({
      verses: allVerses(st.custom),
      memory: st.memory[st.translation],
      queue: st.queue,
      today,
      goal: st.goal,
      newPerDay: st.newPerDay,
      newToday: st.planted[today] ?? 0,
      bias: st.bias,
      translation: st.translation,
      mode,
      focusVerse,
      ...override,
    })
  }

  // Preview of today's session for the home card (stable, no randomness needed)
  const preview = useMemo(() => {
    if (!s.onboarded) return { reviews: 0, fresh: 0, minutes: 0 }
    const p = makePlan('daily', undefined, { seed: 1 })
    return { reviews: p.reviewVerses.length, fresh: p.newVerses.length, minutes: Math.max(2, Math.round(p.cards.length * 0.42)) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.onboarded, s.memory, s.queue, s.goal, s.newPerDay, s.translation, s.planted, today])

  const startDaily = () => setPlan(makePlan(s.learnDays.includes(today) ? 'practice' : 'daily'))
  const startPractice = () => setPlan(makePlan('practice'))
  const startFocus = (id: string) => {
    setSheet(null)
    setPlan(makePlan('practice', id))
  }

  const exitSession = (outcome: SessionOutcome) => {
    setPlan(null)
    const mode = outcome.completed && outcome.mode === 'daily' ? 'daily' : 'practice'
    if (outcome.stats.cards === 0) return
    const res = s.finishSession({ stats: outcome.stats, mode })
    if (outcome.completed || res.newAchievements.length) setFinished({ outcome, ...res })
    setTab('home')
  }

  if (!s.onboarded) {
    return (
      <div className="app">
        <Onboarding
          onDone={(p) => {
            s.finishOnboarding(p)
            // First session immediately: plant the first verse while motivation is highest.
            setTimeout(() => setPlan(makePlan('daily')), 50)
          }}
        />
        <AnimatePresence>{plan && <Session key="session" plan={plan} onExit={exitSession} />}</AnimatePresence>
      </div>
    )
  }

  return (
    <div className="app">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} className="tab-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
          {tab === 'home' && !finished && <Home onStart={startDaily} onPractice={startPractice} onVerse={setSheet} preview={preview} />}
          {tab === 'verses' && <Library onVerse={setSheet} onAdd={() => setAdding(true)} />}
          {tab === 'me' && <Profile />}
        </motion.div>
      </AnimatePresence>

      <nav className="tabbar" aria-label="Navigation">
        {([
          { id: 'home', icon: 'tree', de: 'Garten', en: 'Garden' },
          { id: 'verses', icon: 'book', de: 'Verse', en: 'Verses' },
          { id: 'me', icon: 'user', de: 'Ich', en: 'Me' },
        ] as const).map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'is-on' : ''}`} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
            {tab === t.id && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
            <Icon name={t.icon} size={22} />
            <span>{lang === 'de' ? t.de : t.en}</span>
          </button>
        ))}
      </nav>

      <VerseSheet id={sheet} onClose={() => setSheet(null)} onPractice={startFocus} />
      <AddVerse open={adding} onClose={() => setAdding(false)} onAdded={(id) => { setAdding(false); setSheet(id) }} />

      <AnimatePresence>{plan && <Session key="session" plan={plan} onExit={exitSession} />}</AnimatePresence>
      <AnimatePresence>
        {finished && (
          <Summary
            key="summary"
            {...finished}
            onClose={() => {
              setFinished(null)
              setTab('home')
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
