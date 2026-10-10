import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Exercise, CardResult } from '../lib/exercises'
import type { SessionPlan } from '../lib/session'
import { useStore, allVerses } from '../store'
import { reference } from '../data/verses'
import { sfx, haptic, primeAudio } from '../lib/feedback'
import { emptyStats, type SessionStats } from '../data/goals'
import { STAGE_NAMES, type Stage } from '../lib/fsrs'
import { useLang } from '../lib/i18n'
import Icon from '../components/Icon'
import StageGlyph from '../components/StageGlyph'
import Intro from '../exercises/Intro'
import Order from '../exercises/Order'
import Cloze from '../exercises/Cloze'
import Chain from '../exercises/Chain'
import Spot from '../exercises/Spot'
import Letters from '../exercises/Letters'
import Reference from '../exercises/Reference'
import type { ExerciseApi } from '../exercises/types'

export interface StageChange {
  verseId: string
  before: Stage
  after: Stage
}

export interface SessionOutcome {
  stats: SessionStats
  changes: StageChange[]
  mode: SessionPlan['mode']
  completed: boolean
}

const PRAISE = {
  de: { perfect: ['Makellos.', 'Genau so.', 'Wunderbar.', 'Sitzt.', 'Treffsicher.', 'Stark.'], good: ['Gut gemacht.', 'Weiter so.', 'Das wird.'], hard: ['Dranbleiben – Wiederholung macht’s.', 'Morgen sitzt es fester.'] },
  en: { perfect: ['Flawless.', 'Exactly.', 'Beautiful.', 'Nailed it.', 'Spot on.', 'Strong.'], good: ['Well done.', 'Keep going.', 'Getting there.'], hard: ['Stay with it – repetition works.', 'It’ll be firmer tomorrow.'] },
}

export default function Session({ plan, onExit }: { plan: SessionPlan; onExit: (o: SessionOutcome) => void }) {
  const lang = useLang()
  const translation = useStore((s) => s.translation)
  const custom = useStore((s) => s.custom)
  const recordVerse = useStore((s) => s.recordVerse)
  const recordCards = useStore((s) => s.recordCards)
  const verses = useMemo(() => allVerses(custom), [custom])

  const [index, setIndex] = useState(0)
  const [solved, setSolved] = useState(false)
  const [combo, setCombo] = useState(0)
  const [lastResult, setLastResult] = useState<{ errors: number; items: number } | null>(null)
  const [change, setChange] = useState<StageChange | null>(null)
  const [milestone, setMilestone] = useState<number | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)

  const stats = useRef<SessionStats>(emptyStats())
  const comboRef = useRef(0)
  const perVerse = useRef<Record<string, CardResult[]>>({})
  const changes = useRef<StageChange[]>([])
  const cardStart = useRef(Date.now())
  const cardErrors = useRef(0)

  const card: Exercise | undefined = plan.cards[index]
  const total = plan.cards.length

  // Test hook: lets automated UI tests read the current card (answers) – never used by the app itself.
  if (typeof window !== 'undefined') (window as unknown as { __scriptureCard?: unknown }).__scriptureCard = { card, solved, index, total }

  useEffect(() => {
    primeAudio()
  }, [])

  useEffect(() => {
    cardStart.current = Date.now()
    cardErrors.current = 0
  }, [index])

  const api: ExerciseApi = useMemo(
    () => ({
      correct: () => {
        comboRef.current++
        const c = comboRef.current
        setCombo(c)
        stats.current.maxCombo = Math.max(stats.current.maxCombo, c)
        sfx.correct(c)
        haptic.correct()
        if (card?.kind === 'letters') stats.current.letters++
        if (c > 0 && c % 10 === 0) {
          setMilestone(c)
          setTimeout(() => setMilestone(null), 2200)
        }
      },
      wrong: () => {
        comboRef.current = 0
        setCombo(0)
        cardErrors.current++
        sfx.wrong()
        haptic.wrong()
      },
      done: ({ errors, items }) => {
        if (!card) return
        const ms = Date.now() - cardStart.current
        const res: CardResult = {
          exerciseId: card.id,
          verseId: card.verseId,
          kind: card.kind,
          errors,
          items,
          ms,
          hint: card.kind === 'letters' ? card.hint : undefined,
        }
        const s = stats.current
        s.cards++
        s.errors += errors
        s.items += items
        s.ms += ms
        if (errors === 0 && card.kind !== 'intro') s.perfectCards++
        if (errors === 0 && card.kind === 'order') s.perfectOrder++
        if (card.kind === 'letters' && card.hint >= 2 && errors === 0) s.byHeart++
        ;(perVerse.current[card.verseId] ??= []).push(res)
        if (card.kind !== 'intro') recordCards([res])
        setLastResult({ errors, items })
        setChange(null)
        if (card.final) {
          const { before, after } = recordVerse(card.verseId, perVerse.current[card.verseId])
          if (card.role === 'learn') s.planted++
          const ch = { verseId: card.verseId, before: before as Stage, after: after as Stage }
          changes.current.push(ch)
          if (after !== before) setChange(ch)
          setTimeout(() => {
            sfx.verse()
            haptic.success()
          }, 120)
        }
        setSolved(true)
      },
    }),
    [card, recordVerse, recordCards],
  )

  const next = useCallback(() => {
    if (!solved) return
    if (index + 1 >= total) {
      onExit({ stats: stats.current, changes: changes.current, mode: plan.mode, completed: true })
      return
    }
    setSolved(false)
    setLastResult(null)
    setChange(null)
    setIndex((i) => i + 1)
  }, [solved, index, total, onExit, plan.mode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && solved) next()
      if (e.key === 'Escape') setConfirmExit((c) => !c)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [solved, next])

  const progress = (index + (solved ? 1 : 0)) / total
  const verse = card ? verses[card.verseId] : undefined
  const ref = verse ? reference(verse, translation) : ''

  const praise = useMemo(() => {
    if (!lastResult) return ''
    const P = PRAISE[lang]
    const rate = lastResult.items ? lastResult.errors / lastResult.items : 0
    const list = lastResult.errors === 0 ? P.perfect : rate < 0.25 ? P.good : P.hard
    return list[(index * 7 + combo) % list.length]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResult])

  const exProps = card && verse ? { verse, reference: ref, lang, api, solved } : null
  const flow = combo >= 5

  return (
    <div className="session">
      <header className="session-head">
        <button className="icon-btn" onClick={() => setConfirmExit(true)} aria-label={lang === 'de' ? 'Beenden' : 'Quit'}>
          <Icon name="close" size={22} />
        </button>
        <div className={`pbar ${flow ? 'is-flow' : ''}`} role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className="pbar-fill" initial={false} animate={{ scaleX: Math.max(0.02, progress) }} transition={{ type: 'spring', stiffness: 140, damping: 22 }} />
        </div>
        <AnimatePresence>
          {combo >= 3 && (
            <motion.div
              layout
              className={`combo ${milestone ? 'is-milestone' : ''}`}
              key="combo"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            >
              <motion.span key={combo} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 30 }}>
                {combo}
              </motion.span>
              <Icon name="bolt" size={13} fill stroke={0} />
              <AnimatePresence>
                {milestone && (
                  <motion.span className="combo-msg" initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
                    {lang === 'de' ? 'im Fluss' : 'in the flow'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="session-body">
        <AnimatePresence mode="wait" initial={false}>
          {card && exProps && (
            <motion.div
              key={card.id}
              className="card-stage"
              initial={{ opacity: 0, x: 36, scale: 0.985 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -36, scale: 0.985, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              {card.kind === 'intro' && <Intro ex={card} {...exProps} />}
              {card.kind === 'order' && <Order ex={card} {...exProps} />}
              {card.kind === 'cloze' && <Cloze ex={card} {...exProps} />}
              {card.kind === 'chain' && <Chain ex={card} {...exProps} />}
              {card.kind === 'spot' && <Spot ex={card} {...exProps} />}
              {card.kind === 'letters' && <Letters ex={card} {...exProps} />}
              {card.kind === 'reference' && <Reference ex={card} {...exProps} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {solved && (
          <motion.footer
            className={`feedback ${lastResult && lastResult.errors > 0 ? 'is-mixed' : ''}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { duration: 0.16 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          >
            <div className="feedback-row">
              <motion.div className="feedback-badge" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.05 }}>
                <Icon name={card?.kind === 'intro' ? 'seed' : 'check'} size={22} stroke={2.6} />
              </motion.div>
              <div className="feedback-text">
                <div className="feedback-title">{card?.kind === 'intro' ? (lang === 'de' ? 'Gesät.' : 'Sown.') : praise}</div>
                {change ? (
                  <motion.div className="feedback-stage" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <StageGlyph stage={change.before} size={18} />
                    <span>{STAGE_NAMES[change.before][lang]}</span>
                    <Icon name="chevron" size={14} />
                    <StageGlyph stage={change.after} size={18} />
                    <strong>{STAGE_NAMES[change.after][lang]}</strong>
                  </motion.div>
                ) : (
                  <div className="feedback-sub">{card?.kind === 'intro' ? (lang === 'de' ? 'Jetzt holen wir ihn aus dem Gedächtnis.' : 'Now let’s recall it.') : ref}</div>
                )}
              </div>
            </div>
            <button className="btn block" onClick={next}>
              {index + 1 >= total ? (lang === 'de' ? 'Abschließen' : 'Finish') : lang === 'de' ? 'Weiter' : 'Continue'}
            </button>
          </motion.footer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmExit && (
          <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmExit(false)}>
            <motion.div
              className="dialog"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="h2">{lang === 'de' ? 'Jetzt aufhören?' : 'Stop for now?'}</h3>
              <p className="muted">
                {lang === 'de'
                  ? 'Was du gelernt hast, ist gespeichert. Der Lerntag zählt aber erst, wenn du den Tagesgang beendest.'
                  : 'What you learned is saved. The learning day only counts once you finish today’s session.'}
              </p>
              <div className="col gap-12">
                <button className="btn block" onClick={() => setConfirmExit(false)}>
                  {lang === 'de' ? 'Weiterlernen' : 'Keep going'}
                </button>
                <button
                  className="btn ghost block"
                  onClick={() => onExit({ stats: stats.current, changes: changes.current, mode: plan.mode, completed: false })}
                >
                  {lang === 'de' ? 'Beenden' : 'Quit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">{solved ? praise : ''}</span>
    </div>
  )
}
