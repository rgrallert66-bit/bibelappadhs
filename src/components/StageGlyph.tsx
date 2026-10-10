import type { Stage } from '../lib/fsrs'

/** Small illustrated growth stage – the same visual language as on the tree. */
export default function StageGlyph({ stage, size = 28 }: { stage: Stage; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="stage-glyph">
      {stage === 0 && (
        <g>
          <ellipse cx="16" cy="18" rx="5" ry="6.5" fill="#b89a6a" />
          <path d="M16 12.5c0 3 0 7 0 11" stroke="#8f7449" strokeWidth="1.2" fill="none" />
        </g>
      )}
      {stage === 1 && (
        <g>
          <path d="M16 27V15" stroke="#5f8f4a" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="11.5" cy="13" rx="5" ry="2.6" transform="rotate(-25 11.5 13)" fill="#8ec46d" />
          <ellipse cx="20.5" cy="13" rx="5" ry="2.6" transform="rotate(25 20.5 13)" fill="#a9d18e" />
        </g>
      )}
      {stage === 2 && (
        <g>
          <path d="M16 28V9" stroke="#5f8f4a" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="11" cy="18" rx="5.5" ry="2.6" transform="rotate(-30 11 18)" fill="#6fae55" />
          <ellipse cx="21" cy="14" rx="5.5" ry="2.6" transform="rotate(30 21 14)" fill="#8ec46d" />
          <ellipse cx="16" cy="8" rx="2.6" ry="3.6" fill="#b6dc8e" />
        </g>
      )}
      {stage === 3 && (
        <g>
          <path d="M16 29V16" stroke="#5f8f4a" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="11" cy="22" rx="5" ry="2.4" transform="rotate(-30 11 22)" fill="#6fae55" />
          <path d="M16 18c6-2 5-11 0-13-5 2-6 11 0 13z" fill="url(#bud)" />
          <defs>
            <linearGradient id="bud" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f6c6cf" />
              <stop offset="1" stopColor="#d9788c" />
            </linearGradient>
          </defs>
        </g>
      )}
      {stage === 4 && (
        <g>
          {[0, 1, 2, 3, 4].map((k) => {
            const a = (k / 5) * Math.PI * 2 - Math.PI / 2
            return <ellipse key={k} cx={16 + Math.cos(a) * 6.5} cy={16 + Math.sin(a) * 6.5} rx="6" ry="4.4" transform={`rotate(${(a * 180) / Math.PI} ${16 + Math.cos(a) * 6.5} ${16 + Math.sin(a) * 6.5})`} fill={k % 2 ? '#fde7ec' : '#f8cdd6'} />
          })}
          <circle cx="16" cy="16" r="3.4" fill="#e8b33c" />
        </g>
      )}
      {stage === 5 && (
        <g>
          <circle cx="16" cy="16" r="15" fill="url(#halo)" />
          <circle cx="16" cy="18" r="8.5" fill="url(#fruit)" />
          <ellipse cx="20.5" cy="8.5" rx="4.6" ry="2" transform="rotate(-28 20.5 8.5)" fill="#5f8f4a" />
          <defs>
            <radialGradient id="fruit" cx="0.38" cy="0.32" r="0.75">
              <stop offset="0" stopColor="#fff2bf" />
              <stop offset="0.45" stopColor="#f2c14e" />
              <stop offset="1" stopColor="#c88a1e" />
            </radialGradient>
            <radialGradient id="halo">
              <stop offset="0" stopColor="rgba(255,214,120,0.55)" />
              <stop offset="1" stopColor="rgba(255,214,120,0)" />
            </radialGradient>
          </defs>
        </g>
      )}
    </svg>
  )
}
