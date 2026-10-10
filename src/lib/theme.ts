import { useEffect, useState } from 'react'
import { useStore } from '../store'

/** Whether the dark palette is active (explicit setting or system preference). */
export function useTheme(): boolean {
  const theme = useStore((s) => s.theme)
  const [systemDark, setSystemDark] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => setSystemDark(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'auto') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])
  return theme === 'dark' || (theme === 'auto' && systemDark)
}
