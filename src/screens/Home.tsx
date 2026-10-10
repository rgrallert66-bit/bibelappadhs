import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, animate } from 'motion/react'
import { useStore, allVerses, todayQuestProgress } from '../store'
import TreeCanvas, { type SkyMode } from '../components/TreeCanvas'
import { stageOf } from '../lib/fsrs'
import { dayKey, season, streak, weekDays } from '../lib/dates'
import { reference } from '../data/verses'
import { useLang } from '../lib/i18n'
import { sfx, haptic } from '../lib/feedback'
import Icon from '../components/Icon'
import { useTheme } from '../lib/theme'

export function skyFor(dark: boolean, d = new Date()): SkyMode {
  if (dark) return 'night'
  const h = d.getHours()
  if (h >= 5 && h < 9) return 'dawn'
  if (h >= 17 || h < 5) return 'golden'
  return 'day'
}

interface Props {
  onStart: () => void
  onPractice: () => void
  onVerse: (id: string) => void
  preview: { reviews: number; fresh: number; minutes: number }
}

export default function Home({ onStart, onPractice, onVerse, preview }: Props) {
  const lang = useLang()
  const s = useStore()
  const dark = useTheme()
  const today = dayKey()
  const learnSet = useMemo(() => new Set(s.learnDays), [s.learnDays])
  const st = streak(learnSet, today)
  const doneToday = learnSet.has(today)
  const verses = allVerses(s.custom)
  const memory = s.memory[s.translation]
  const fruits = useMemo(
    () =>
      Object.keys(memory)
        .filter((id) => verses[id])
        .sort((a, b) => (memory[a].reps === 0 ? 1 : 0) - (memory[b].reps === 0 ? 1 : 0))
        .map((id) => ({ id, stage: stageOf(memory[id]) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [memory],
  )
  const fruitCount = fruits.filter((f) => f.stage === 5).length
  const quests = todayQuestProgress(s)

  // ---- growth animation: from last seen day count to the current one ----
  const target = s.learnDays.length
  const [age, setAge] = useState(() => (s.treeSeen < target ? s.treeSeen : target))
  const [growing, setGrowing] = useState(false)
  const [glow, setGlow] = useState(0)
  const ctl = useRef<{ stop: () => void } | null>(null)
  useEffect(() => {
    if (s.treeSeen >= target) return
    const from = s.treeSeen
    const t0 = setTimeout(() => {
      setGrowing(true)
      sfx.day()
      haptic.success()
      let step = 0
      ctl.current = animate(from, target, {
        duration: 3.4,
        ease: [0.45, 0, 0.2, 1],
        onUpdate: (v) => {
          setAge(v)
          setGlow(Math.sin(((v - from) / Math.max(0.001, target - from)) * Math.PI))
          const k = Math.floor((v - from) * 6)
          if (k > step) {
            step = k
            sfx.grow(k)
          }
        },
        onComplete: () => {
          setGrowing(false)
          setGlow(0)
          useStore.getState().markTreeSeen()
        },
      })
    }, 650)
    return () => {
      clearTimeout(t0)
      ctl.current?.stop()
    }
  }, [target, s.treeSeen])
  useEffect(() => {
    if (!growing && s.treeSeen >= target) setAge(target)
  }, [target, growing, s.treeSeen])

  const hour = new Date().getHours()
  const greeting =
    lang === 'de'
      ? hour < 11 ? 'Guten Morgen' : hour < 17 ? 'Schön, dass du da bist' : 'Guten Abend'
      : hour < 11 ? 'Good morning' : hour < 17 ? 'Good to see you' : 'Good evening'

  const week = weekDays(today)
  const dow = lang === 'de' ? ['M', 'D', 'M', 'D', 'F', 'S', 'S'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const highlight = s.highlight
  const highlightVerse = highlight && verses[highlight]

  return (
    <div className="screen home">
      <div className="home-hero">
        <div className="home-tree">
          <TreeCanvas age={Math.max(0.6, age)} fruits={fruits} golden={s.goldenDays.length} season={season()} sky={skyFor(dark)} highlight={highlight} onFruit={onVerse} glow={glow} />
        </div>
        <div className="home-top">
          <div>
            <div className="home-greet">{greeting}{s.name ? `, ${s.name}` : ''}</div>
            <div className="home-day serif">
              {lang === 'de' ? 'Tag' : 'Day'}{' '}
              <span key={Math.floor(age + 0.02)} className={growing ? 'day-pop' : undefined}>
                {Math.max(0, Math.floor(age + 0.02))}
              </span>
            </div>
          </div>
          <div className="home-pills">
            <div className={`pill ${st.today ? 'is-lit' : ''}`} title={lang === 'de' ? 'Serie' : 'Streak'}>
              <Icon name="sun" size={16} />
              <span>{st.count}</span>
            </div>
            <div className="pill" title={lang === 'de' ? 'Früchte' : 'Fruit'}>
              <span className="pill-fruit" />
              <span>{fruitCount}</span>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {growing && (
            <motion.div className="grow-caption" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              {lang === 'de' ? 'Dein Baum wächst …' : 'Your tree is growing …'}
            </motion.div>
          )}
        </AnimatePresence>
        {!growing && highlightVerse && (
          <motion.button className="hl-chip" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={() => onVerse(highlightVerse.id)}>
            <span className="hl-dot" />
            {reference(highlightVerse, s.translation)}
          </motion.button>
        )}
      </div>

      <motion.section className="cta card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        {!doneToday ? (
          <>
            <div className="cta-head">
              <div>
                <div className="eyebrow">{lang === 'de' ? 'Dein Tagesgang' : 'Today’s session'}</div>
                <div className="cta-title serif">
                  {preview.fresh > 0 && preview.reviews === 0
                    ? lang === 'de' ? 'Ein neuer Vers wartet' : 'A new verse awaits'
                    : preview.fresh > 0
                      ? lang === 'de' ? 'Pflegen & neu pflanzen' : 'Tend & plant'
                      : lang === 'de' ? 'Verse pflegen' : 'Tend your verses'}
                </div>
              </div>
              <div className="cta-time">
                <span>{preview.minutes}</span>
                <small>min</small>
              </div>
            </div>
            <div className="cta-meta">
              {preview.reviews > 0 && <span className="chip"><Icon name="drop" size={14} /> {preview.reviews} {lang === 'de' ? (preview.reviews === 1 ? 'Vers gießen' : 'Verse gießen') : preview.reviews === 1 ? 'to water' : 'to water'}</span>}
              {preview.fresh > 0 && <span className="chip"><Icon name="sparkle" size={14} /> {preview.fresh} {lang === 'de' ? 'neu' : 'new'}</span>}
              {st.atRisk && <span className="chip chip-warn">{lang === 'de' ? 'Serie heute fortsetzen' : 'Keep your streak today'}</span>}
            </div>
            <button className="btn block cta-btn" onClick={onStart}>
              <Icon name="play" size={18} fill stroke={0} />
              {lang === 'de' ? 'Beginnen' : 'Start'}
            </button>
          </>
        ) : (
          <>
            <div className="cta-head">
              <div>
                <div className="eyebrow" style={{ color: 'var(--moss)' }}>{lang === 'de' ? 'Heute vollendet' : 'Done for today'}</div>
                <div className="cta-title serif">{lang === 'de' ? 'Dein Baum ist gewachsen.' : 'Your tree has grown.'}</div>
              </div>
              <div className="cta-check">
                <Icon name="check" size={22} stroke={2.6} />
              </div>
            </div>
            <p className="cta-note muted">
              {lang === 'de'
                ? 'Morgen wächst er weiter. Wer möchte, kann trotzdem noch üben – Wiederholung festigt.'
                : 'It grows again tomorrow. Extra practice still strengthens your verses.'}
            </p>
            <button className="btn ghost block" onClick={onPractice}>
              {lang === 'de' ? 'Freies Üben' : 'Free practice'}
            </button>
          </>
        )}
      </motion.section>

      <section className="week card">
        {week.map((d, i) => {
          const done = learnSet.has(d)
          const rest = st.restDays.includes(d)
          const isToday = d === today
          const golden = s.goldenDays.includes(d)
          return (
            <div key={d} className={`week-day ${done ? 'is-done' : ''} ${rest ? 'is-rest' : ''} ${isToday ? 'is-today' : ''} ${golden ? 'is-golden' : ''}`}>
              <span className="week-label">{dow[i]}</span>
              <span className="week-dot">{done && <Icon name="check" size={13} stroke={3} />}</span>
            </div>
          )
        })}
      </section>

      <section className="quests card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <div className="h2" style={{ fontSize: 19 }}>{lang === 'de' ? 'Tagesziele' : 'Daily goals'}</div>
          <span className="faint" style={{ fontSize: 12.5, fontWeight: 600 }}>
            {lang === 'de' ? 'Alle drei = goldenes Blatt' : 'All three = a golden leaf'}
          </span>
        </div>
        {quests.map((q) => (
          <div key={q.id} className={`quest ${q.done ? 'is-done' : ''}`}>
            <div className="quest-ring">
              <svg viewBox="0 0 36 36" width="36" height="36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="var(--line-2)" strokeWidth="3" />
                <motion.circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke={q.done ? 'var(--gold)' : 'var(--moss)'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="94.25"
                  initial={{ strokeDashoffset: 94.25 }}
                  animate={{ strokeDashoffset: 94.25 * (1 - q.value / q.target) }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  transform="rotate(-90 18 18)"
                />
              </svg>
              {q.done && <Icon name="check" size={14} stroke={3} style={{ position: 'absolute', color: 'var(--gold)' }} />}
            </div>
            <div className="grow">
              <div className="quest-name">{lang === 'de' ? q.de : q.en}</div>
              <div className="quest-val faint">{q.value} / {q.target}</div>
            </div>
          </div>
        ))}
      </section>

      <p className="home-foot faint serif">
        {lang === 'de' ? '„In meinem Herzen habe ich dein Wort verwahrt.“ — Psalm 119,11' : '“Your word I have hidden in my heart.” — Psalm 119:11'}
      </p>
    </div>
  )
}
