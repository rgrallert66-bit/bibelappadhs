import { useState } from 'react'
import { useStore } from '../store'
import { useLang } from '../lib/i18n'
import Sheet from '../components/Sheet'

/** Users can add verses from their own Bible – text stays on the device. */
export default function AddVerse({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (id: string) => void }) {
  const lang = useLang()
  const addCustom = useStore((s) => s.addCustom)
  const [label, setLabel] = useState('')
  const [text, setText] = useState('')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const ok = label.trim().length > 1 && words >= 3 && words <= 120

  return (
    <Sheet open={open} onClose={onClose} label={lang === 'de' ? 'Vers hinzufügen' : 'Add verse'}>
      <div className="vsheet">
        <h3 className="h2">{lang === 'de' ? 'Eigenen Vers pflanzen' : 'Plant your own verse'}</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          {lang === 'de'
            ? 'Übertrage einen Vers aus deiner eigenen Bibel. Der Text bleibt nur auf diesem Gerät.'
            : 'Copy a verse from your own Bible. The text stays on this device only.'}
        </p>
        <label className="field">
          <span>{lang === 'de' ? 'Stelle' : 'Reference'}</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={lang === 'de' ? 'z. B. Römer 15,13' : 'e.g. Romans 15:13'} maxLength={40} />
        </label>
        <label className="field">
          <span>{lang === 'de' ? 'Text' : 'Text'}</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder={lang === 'de' ? 'Vers-Text …' : 'Verse text …'} />
        </label>
        <button
          className="btn block"
          disabled={!ok}
          onClick={() => {
            const id = addCustom(label.trim(), text.trim().replace(/\s+/g, ' '))
            setLabel('')
            setText('')
            onAdded(id)
          }}
        >
          {lang === 'de' ? 'Pflanzen' : 'Plant'}
        </button>
      </div>
    </Sheet>
  )
}
