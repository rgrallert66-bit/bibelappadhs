import { useStore, allVerses } from '../store'
import { COPYRIGHT, reference } from '../data/verses'
import { retrievability, stageOf, STAGE_NAMES, STAGE_THRESHOLDS, type Stage } from '../lib/fsrs'
import { dayKey, daysBetween } from '../lib/dates'
import { useLang } from '../lib/i18n'
import Sheet from '../components/Sheet'
import StageGlyph from '../components/StageGlyph'
import { dueLabel } from './Library'
import { motion } from 'motion/react'

export default function VerseSheet({ id, onClose, onPractice }: { id: string | null; onClose: () => void; onPractice: (id: string) => void }) {
  const lang = useLang()
  const s = useStore()
  const verses = allVerses(s.custom)
  const v = id ? verses[id] : undefined
  const m = v ? s.memory[s.translation][v.id] : undefined
  const stage = stageOf(m)
  const recall = m ? Math.round(retrievability(daysBetween(m.last, dayKey()), m.stability) * 100) : 0
  const nextStage = (Math.min(5, stage + 1)) as Stage
  const toNext = m && stage < 5 ? Math.max(0, STAGE_THRESHOLDS[nextStage] - m.stability) : 0

  return (
    <Sheet open={!!v} onClose={onClose} label={v ? reference(v, s.translation) : ''}>
      {v && (
        <div className="vsheet">
          <div className="eyebrow" style={{ color: 'var(--gold)' }}>{reference(v, s.translation)}</div>
          <p className="vsheet-text serif">{v.text[s.translation]}</p>

          <div className="stage-track">
            {([1, 2, 3, 4, 5] as Stage[]).map((st) => (
              <div key={st} className={`stage-step ${stage >= st ? 'is-on' : ''} ${stage === st ? 'is-cur' : ''}`}>
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: stage >= st ? 1 : 0.28 }} transition={{ delay: st * 0.05, type: 'spring', stiffness: 400, damping: 22 }}>
                  <StageGlyph stage={st} size={30} />
                </motion.div>
                <span>{STAGE_NAMES[st][lang]}</span>
              </div>
            ))}
          </div>

          {m ? (
            <div className="vstats">
              <div>
                <strong>{recall}%</strong>
                <span>{lang === 'de' ? 'Erinnerung heute' : 'recall today'}</span>
              </div>
              <div>
                <strong>{m.stability < 1 ? '<1' : Math.round(m.stability)}</strong>
                <span>{lang === 'de' ? 'Tage Festigkeit' : 'days stability'}</span>
              </div>
              <div>
                <strong>{dueLabel(m.due, lang)}</strong>
                <span>{lang === 'de' ? 'nächstes Gießen' : 'next watering'}</span>
              </div>
            </div>
          ) : (
            <p className="muted" style={{ margin: '4px 0 18px' }}>
              {lang === 'de' ? 'Dieser Vers ist noch ein Same. Pflanze ihn – er wächst mit jeder Wiederholung.' : 'This verse is still a seed. Plant it – it grows with every review.'}
            </p>
          )}
          {m && stage < 5 && (
            <p className="faint vsheet-hint">
              {lang === 'de'
                ? `Noch etwa ${Math.ceil(toNext)} ${Math.ceil(toNext) === 1 ? 'Tag' : 'Tage'} Festigkeit bis zur ${STAGE_NAMES[nextStage].de}.`
                : `About ${Math.ceil(toNext)} more day${Math.ceil(toNext) === 1 ? '' : 's'} of stability to ${STAGE_NAMES[nextStage].en.toLowerCase()}.`}
            </p>
          )}

          <div className="col gap-12" style={{ marginTop: 8 }}>
            <button className="btn block" onClick={() => onPractice(v.id)}>
              {m ? (lang === 'de' ? 'Jetzt üben' : 'Practise now') : lang === 'de' ? 'Jetzt pflanzen' : 'Plant now'}
            </button>
            {!m && (
              <button className="btn ghost block" onClick={() => { s.enqueue(v.id); onClose() }}>
                {lang === 'de' ? 'Als Nächstes lernen' : 'Learn next'}
              </button>
            )}
            {v.custom && (
              <button className="btn ghost block" style={{ color: 'var(--rose)' }} onClick={() => { s.removeCustom(v.id); onClose() }}>
                {lang === 'de' ? 'Vers entfernen' : 'Remove verse'}
              </button>
            )}
          </div>
          {!v.custom && <p className="copyright">{COPYRIGHT[s.translation].notice}</p>}
        </div>
      )}
    </Sheet>
  )
}
