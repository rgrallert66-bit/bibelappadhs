import { memo, useState } from 'react'
import type { Lang } from '../lib/i18n'

const LAYOUT: Record<Lang, string[][]> = {
  de: ['qwertzuiopü'.split(''), 'asdfghjklöä'.split(''), 'yxcvbnm'.split('')],
  en: ['qwertyuiop'.split(''), 'asdfghjkl'.split(''), 'zxcvbnm'.split('')],
}

export type KeyFlash = { key: string; ok: boolean; n: number } | null

/** In-app keyboard: large, instant, tactile – no OS keyboard covering the verse. */
function Keyboard({ lang, onKey, flash, disabled }: { lang: Lang; onKey: (k: string) => void; flash: KeyFlash; disabled?: boolean }) {
  const [pressed, setPressed] = useState<string | null>(null)
  return (
    <div className={`kb ${disabled ? 'is-disabled' : ''}`} role="group" aria-label="Keyboard">
      {LAYOUT[lang].map((row, r) => (
        <div className="kb-row" key={r}>
          {row.map((k) => {
            const f = flash && flash.key === k ? (flash.ok ? 'ok' : 'bad') : ''
            return (
              <button
                key={k + (f ? flash!.n : '')}
                className={`kb-key ${f ? `is-${f}` : ''} ${pressed === k ? 'is-pressed' : ''}`}
                onPointerDown={(e) => {
                  e.preventDefault()
                  if (disabled) return
                  setPressed(k)
                  onKey(k)
                }}
                onPointerUp={() => setPressed(null)}
                onPointerLeave={() => setPressed(null)}
                aria-label={k}
              >
                {k}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default memo(Keyboard)
