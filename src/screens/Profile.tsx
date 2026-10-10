import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../store'
import { ACHIEVEMENTS } from '../data/goals'
import { COPYRIGHT } from '../data/verses'
import { stageOf } from '../lib/fsrs'
import { addDays, dayKey, parseDay, streak } from '../lib/dates'
import { GOALS, type DailyGoal } from '../lib/session'
import { useLang } from '../lib/i18n'
import Icon from '../components/Icon'
import Sheet from '../components/Sheet'

function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((o) => (
        <button key={String(o.v)} role="radio" aria-checked={value === o.v} className={`seg-opt ${value === o.v ? 'is-on' : ''}`} onClick={() => onChange(o.v)}>
          {value === o.v && <motion.span layoutId={`seg-${options.map((x) => x.v).join()}`} className="seg-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
          <span className="seg-label">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button className={`toggle ${on ? 'is-on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}>
      <motion.span className="toggle-knob" layout transition={{ type: 'spring', stiffness: 600, damping: 34 }} />
    </button>
  )
}

export default function Profile() {
  const lang = useLang()
  const s = useStore()
  const [science, setScience] = useState(false)
  const [legal, setLegal] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const today = dayKey()
  const set = useMemo(() => new Set(s.learnDays), [s.learnDays])
  const st = streak(set, today)
  const memory = s.memory[s.translation]
  const stages = Object.values(memory).map(stageOf)
  const fruits = stages.filter((x) => x === 5).length
  const totalMin = Math.round(Object.values(s.log).reduce((a, l) => a + l.ms, 0) / 60000)

  // 18 weeks calendar, Monday-first columns
  const weeks = 18
  const start = (() => {
    const d = parseDay(today)
    const dow = (d.getDay() + 6) % 7
    return addDays(today, -dow - (weeks - 1) * 7)
  })()
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i))

  const stats = [
    { v: s.learnDays.length, l: lang === 'de' ? 'Lerntage' : 'Learning days' },
    { v: st.count, l: lang === 'de' ? 'Serie' : 'Streak' },
    { v: Object.keys(memory).length, l: lang === 'de' ? 'Verse' : 'Verses' },
    { v: fruits, l: lang === 'de' ? 'Früchte' : 'Fruit' },
    { v: s.bestCombo, l: lang === 'de' ? 'Beste Serie' : 'Best run' },
    { v: totalMin, l: lang === 'de' ? 'Minuten' : 'Minutes' },
  ]

  return (
    <div className="screen profile">
      <header className="lib-head">
        <div className="eyebrow">{lang === 'de' ? 'Dein Weg' : 'Your journey'}</div>
        <h1 className="h1">{s.name || (lang === 'de' ? 'Fortschritt' : 'Progress')}</h1>
      </header>

      <section className="stats-grid">
        {stats.map((x, i) => (
          <motion.div key={x.l} className="stat card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <strong className="serif">{x.v}</strong>
            <span>{x.l}</span>
          </motion.div>
        ))}
      </section>

      <section className="card cal">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="h2" style={{ fontSize: 19 }}>{lang === 'de' ? 'Lerntage' : 'Learning days'}</div>
          <span className="faint" style={{ fontSize: 12.5, fontWeight: 600 }}>{lang === 'de' ? '18 Wochen' : '18 weeks'}</span>
        </div>
        <div className="cal-grid" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
          {Array.from({ length: weeks }, (_, w) => (
            <div key={w} className="cal-col">
              {cells.slice(w * 7, w * 7 + 7).map((d) => {
                const on = set.has(d)
                const gold = s.goldenDays.includes(d)
                const rest = st.restDays.includes(d)
                const future = d > today
                return <span key={d} title={d} className={`cal-cell ${on ? 'is-on' : ''} ${gold ? 'is-gold' : ''} ${rest ? 'is-rest' : ''} ${future ? 'is-future' : ''} ${d === today ? 'is-today' : ''}`} />
              })}
            </div>
          ))}
        </div>
        <div className="cal-legend faint">
          <span><i className="cal-cell is-on" /> {lang === 'de' ? 'gelernt' : 'learned'}</span>
          <span><i className="cal-cell is-gold" /> {lang === 'de' ? 'goldenes Blatt' : 'golden leaf'}</span>
          <span><i className="cal-cell is-rest" /> {lang === 'de' ? 'Ruhetag' : 'rest day'}</span>
        </div>
      </section>

      <section className="card ach">
        <div className="h2" style={{ fontSize: 19, marginBottom: 14 }}>{lang === 'de' ? 'Meilensteine' : 'Milestones'}</div>
        <div className="ach-grid">
          {ACHIEVEMENTS.map((a) => {
            const got = !!s.achievements[a.id]
            return (
              <div key={a.id} className={`medal ${got ? 'is-got' : ''}`} title={lang === 'de' ? a.descDe : a.descEn}>
                <div className="medal-disc">
                  <Icon name={got ? a.glyph : 'lock'} size={got ? 22 : 16} />
                </div>
                <span className="medal-name">{lang === 'de' ? a.de : a.en}</span>
                <span className="medal-desc">{lang === 'de' ? a.descDe : a.descEn}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card settings">
        <div className="h2" style={{ fontSize: 19, marginBottom: 8 }}>{lang === 'de' ? 'Einstellungen' : 'Settings'}</div>
        <div className="set-row col">
          <span className="set-label">{lang === 'de' ? 'Bibelübersetzung' : 'Bible translation'}</span>
          <Segmented value={s.translation} options={[{ v: 'elb', label: 'Elberfelder' }, { v: 'nkjv', label: 'NKJV' }]} onChange={(v) => s.setSettings({ translation: v })} />
          <span className="set-help">{lang === 'de' ? 'Jede Übersetzung hat ihren eigenen Lernstand. Die Sprache der App folgt der Übersetzung.' : 'Each translation keeps its own progress. The app language follows the translation.'}</span>
        </div>
        <div className="set-row col">
          <span className="set-label">{lang === 'de' ? 'Tagesrhythmus' : 'Daily rhythm'}</span>
          <Segmented<DailyGoal>
            value={s.goal}
            options={(Object.keys(GOALS) as DailyGoal[]).map((g) => ({ v: g, label: `${lang === 'de' ? GOALS[g].label : GOALS[g].labelEn} · ${GOALS[g].minutes}′` }))}
            onChange={(v) => s.setSettings({ goal: v })}
          />
        </div>
        <div className="set-row col">
          <span className="set-label">{lang === 'de' ? 'Neue Verse pro Tag' : 'New verses per day'}</span>
          <Segmented value={s.newPerDay} options={[{ v: 0, label: lang === 'de' ? 'Nur pflegen' : 'Review only' }, { v: 1, label: '1' }, { v: 2, label: '2' }]} onChange={(v) => s.setSettings({ newPerDay: v })} />
        </div>
        <div className="set-row">
          <span className="set-label grow">{lang === 'de' ? 'Klänge' : 'Sounds'}</span>
          <Toggle on={s.sound} onChange={(v) => s.setSettings({ sound: v })} label="sound" />
        </div>
        <div className="set-row">
          <span className="set-label grow">{lang === 'de' ? 'Vibration' : 'Haptics'}</span>
          <Toggle on={s.haptics} onChange={(v) => s.setSettings({ haptics: v })} label="haptics" />
        </div>
        <div className="set-row col">
          <span className="set-label">{lang === 'de' ? 'Erscheinungsbild' : 'Appearance'}</span>
          <Segmented value={s.theme} options={[{ v: 'auto', label: 'Auto' }, { v: 'light', label: lang === 'de' ? 'Hell' : 'Light' }, { v: 'dark', label: lang === 'de' ? 'Dunkel' : 'Dark' }]} onChange={(v) => s.setSettings({ theme: v })} />
        </div>
        <div className="set-row">
          <span className="set-label grow">{lang === 'de' ? 'Dein Name' : 'Your name'}</span>
          <input className="name-input" value={s.name} maxLength={20} placeholder={lang === 'de' ? 'optional' : 'optional'} onChange={(e) => s.setSettings({ name: e.target.value })} />
        </div>
      </section>

      <section className="card links">
        <button className="link-row" onClick={() => setScience(true)}>
          <Icon name="lightbulb" size={20} />
          <span className="grow">{lang === 'de' ? 'Wie Scripture lernt' : 'How Scripture teaches'}</span>
          <Icon name="chevron" size={18} />
        </button>
        <button className="link-row" onClick={() => setLegal(true)}>
          <Icon name="book" size={20} />
          <span className="grow">{lang === 'de' ? 'Bibeltexte & Rechte' : 'Bible texts & rights'}</span>
          <Icon name="chevron" size={18} />
        </button>
        <button className="link-row" style={{ color: 'var(--rose)' }} onClick={() => setConfirmReset(true)}>
          <Icon name="close" size={20} />
          <span className="grow">{lang === 'de' ? 'Alles zurücksetzen' : 'Reset everything'}</span>
        </button>
      </section>

      <Sheet open={science} onClose={() => setScience(false)} label="science">
        <div className="vsheet prose">
          <h3 className="h2">{lang === 'de' ? 'Wie Scripture lernt' : 'How Scripture teaches'}</h3>
          {lang === 'de' ? (
            <>
              <p><strong>Abrufen statt Lesen.</strong> Fast jede Karte lässt dich den Vers aus dem Gedächtnis holen. Abruf festigt Erinnerung deutlich stärker als erneutes Lesen (Testing-Effekt, Roediger & Karpicke 2006).</p>
              <p><strong>Verblassende Hilfen.</strong> Ein neuer Vers beginnt mit vollem Text, dann Phrasen ordnen, Lücken, Wortformen – bis nur noch die Stelle bleibt. So gelingt der Einstieg fast fehlerfrei, und die Anstrengung wächst mit dir („desirable difficulties“, Bjork).</p>
              <p><strong>Anfangsbuchstaben.</strong> Den ersten Buchstaben jedes Wortes zu tippen zwingt dich, jedes Wort abzurufen – schnell, rhythmisch und nachweislich wirksam für wortgetreues Auswendiglernen.</p>
              <p><strong>Phrasen statt Wortsalat.</strong> Verse werden in kurze Sinnabschnitte von 3–6 Wörtern zerlegt – passend zur Kapazität des Arbeitsgedächtnisses (Chunking).</p>
              <p><strong>Wiederholen im richtigen Moment.</strong> Der FSRS-Algorithmus berechnet für jeden Vers, wann deine Erinnerung auf etwa 90 % sinkt – genau dann kommt er zurück. Die Abstände wachsen von Tagen zu Monaten (Spacing-Effekt).</p>
              <p><strong>Schlaf als Verbündeter.</strong> Ein neuer Vers kommt am nächsten Tag wieder: Nach dem Schlaf ist er konsolidiert und der erste Abruf besonders wirksam.</p>
              <p><strong>Gemischt üben.</strong> Karten verschiedener Verse wechseln sich ab (Interleaving) – das trainiert, die richtige Stelle gezielt abzurufen.</p>
              <p><strong>Die 85-%-Zone.</strong> Die App passt die Schwierigkeit laufend an, sodass du etwa 85 % richtig hast – der Bereich, in dem Lernen am schnellsten geht und Flow entsteht.</p>
              <p><strong>Laut lesen.</strong> Beim Entdecken lohnt es sich, halblaut mitzusprechen: Gesprochenes bleibt besser hängen (Production-Effekt).</p>
              <p><strong>Tage statt Marathon.</strong> Dein Baum wächst pro Lerntag, nicht pro Wiederholung – verteiltes Lernen schlägt Pauken.</p>
            </>
          ) : (
            <>
              <p><strong>Recall, not rereading.</strong> Almost every card makes you retrieve the verse from memory – far more effective than rereading (testing effect, Roediger & Karpicke 2006).</p>
              <p><strong>Fading cues.</strong> A new verse starts with the full text, then arranging phrases, gaps, word shapes – until only the reference remains. Nearly errorless at first, then effort grows with you (desirable difficulties, Bjork).</p>
              <p><strong>First letters.</strong> Typing each word’s first letter forces retrieval of every word – fast, rhythmic and proven for verbatim memorisation.</p>
              <p><strong>Phrases, not word salad.</strong> Verses are split into 3–6 word units that fit working memory (chunking).</p>
              <p><strong>Review at the right moment.</strong> The FSRS algorithm predicts when your recall drops to ~90 % and brings the verse back exactly then. Intervals grow from days to months (spacing effect).</p>
              <p><strong>Sleep helps.</strong> A new verse returns the next day – after sleep consolidation the first recall is especially effective.</p>
              <p><strong>Mixed practice.</strong> Cards from different verses alternate (interleaving), training precise retrieval.</p>
              <p><strong>The 85 % zone.</strong> Difficulty adapts so you get about 85 % right – where learning is fastest and flow happens.</p>
              <p><strong>Read aloud.</strong> Speaking while discovering a verse improves memory (production effect).</p>
              <p><strong>Days, not marathons.</strong> Your tree grows per learning day, not per repetition – distributed practice beats cramming.</p>
            </>
          )}
        </div>
      </Sheet>

      <Sheet open={legal} onClose={() => setLegal(false)} label="legal">
        <div className="vsheet prose">
          <h3 className="h2">{lang === 'de' ? 'Bibeltexte & Rechte' : 'Bible texts & rights'}</h3>
          <p>{COPYRIGHT.elb.notice}</p>
          <p>{COPYRIGHT.nkjv.notice}</p>
          <p className="muted">
            {lang === 'de'
              ? 'Scripture enthält eine kleine Auswahl von Lernversen im Rahmen der Zitierregeln der Verlage. Für eine öffentliche Veröffentlichung der App ist eine schriftliche Genehmigung beider Verlage erforderlich. Eigene Verse, die du hinzufügst, bleiben ausschließlich auf deinem Gerät.'
              : 'Scripture contains a small selection of memory verses within the publishers’ quotation guidelines. Public distribution of the app requires written permission from both publishers. Verses you add yourself stay on your device only.'}
          </p>
        </div>
      </Sheet>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} label="reset">
        <div className="vsheet">
          <h3 className="h2">{lang === 'de' ? 'Wirklich alles löschen?' : 'Really delete everything?'}</h3>
          <p className="muted" style={{ margin: '10px 0 20px' }}>{lang === 'de' ? 'Dein Baum, deine Verse und alle Lerntage werden entfernt.' : 'Your tree, verses and all learning days will be removed.'}</p>
          <div className="col gap-12">
            <button className="btn block" onClick={() => setConfirmReset(false)}>{lang === 'de' ? 'Abbrechen' : 'Cancel'}</button>
            <button className="btn ghost block" style={{ color: 'var(--rose)' }} onClick={() => { s.reset(); setConfirmReset(false) }}>{lang === 'de' ? 'Zurücksetzen' : 'Reset'}</button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
