import type { CSSProperties } from 'react'

const PATHS: Record<string, string> = {
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  chevron: 'M9 6l6 6-6 6',
  back: 'M15 6l-6 6 6 6',
  plus: 'M12 5v14M5 12h14',
  tree: 'M12 21v-6M12 15c-4 0-7-2.5-7-6a7 7 0 0114 0c0 3.5-3 6-7 6zM12 15l-3-3M12 13l3-3',
  book: 'M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5v-15zM4 20.5A2.5 2.5 0 006.5 23H20M8 7h8',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6',
  sun: 'M12 16a4 4 0 100-8 4 4 0 000 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z',
  sound: 'M11 5L6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13',
  mute: 'M11 5L6 9H3v6h3l5 4V5zM16 9l6 6M22 9l-6 6',
  leaf: 'M5 19c0-8 6-14 15-14 0 9-6 15-14 15M5 19l7-7',
  seed: 'M12 20c-4 0-6-3-6-7 0-5 6-10 6-10s6 5 6 10c0 4-2 7-6 7zM12 20v-9',
  drop: 'M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z',
  flame: 'M12 22c4 0 7-2.8 7-7 0-5-5-7-4.5-12C11 5 9 8 9 11c-1-1-1.5-2-1.5-3C5.8 10 5 12.3 5 15c0 4.2 3 7 7 7z',
  crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z',
  fruit: 'M12 21a7 7 0 100-14 7 7 0 000 14zM12 7c0-2 1-3.5 3-4',
  dove: 'M3 14c4 0 6-2 8-6 1 3 3 4 6 4l4-3-1 5c-1 4-5 6-9 6-3 0-6-2-8-6z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z',
  lightbulb: 'M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z',
  play: 'M7 4l13 8-13 8V4z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 018 0v4',
  delete: 'M10 7h11v10H10l-6-5 6-5zM13 10l4 4M17 10l-4 4',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  heart: 'M12 21s-7.5-4.6-9.5-9.3C1 8 3.3 4.5 7 4.5c2 0 3.6 1.2 5 3 1.4-1.8 3-3 5-3 3.7 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z',
}

export type IconName = keyof typeof PATHS

export default function Icon({ name, size = 22, stroke = 2, style, fill }: { name: IconName | string; size?: number; stroke?: number; style?: CSSProperties; fill?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden>
      <path d={PATHS[name] ?? ''} />
    </svg>
  )
}
