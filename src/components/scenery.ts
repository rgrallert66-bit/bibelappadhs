/**
 * The garden around the tree grows with the learner, quietly and without fanfare:
 *  –   7 learning days: wildflowers in the grass
 *  –  21 learning days: a brook ("planted by the rivers of water", Psalm 1:3)
 *  –  50 learning days: birds visit the crown
 *  – 100 learning days: a lantern at the foot of the tree ("a lamp to my feet", Psalm 119:105)
 */
import { rng } from '../lib/random'

export const SCENERY = [
  { id: 'flowers', days: 7, de: 'Wildblumen', en: 'Wildflowers' },
  { id: 'brook', days: 21, de: 'Ein Wasserbach', en: 'A brook' },
  { id: 'birds', days: 50, de: 'Vögel im Geäst', en: 'Birds in the branches' },
  { id: 'lantern', days: 100, de: 'Eine Leuchte für den Fuß', en: 'A lamp to your feet' },
] as const

export function sceneryUnlocked(days: number) {
  return SCENERY.filter((s) => days >= s.days).map((s) => s.id) as string[]
}

const FLOWERS = Array.from({ length: 40 }, (_, i) => {
  const r = rng(3000 + i)
  return { x: r(), y: r(), c: Math.floor(r() * 4), s: 0.7 + r() * 0.6, ph: r() * 6 }
})
const FLOWER_COLORS = ['#f4f0e6', '#f2c6d0', '#e9c75a', '#b9a6e0']
const FLOWER_NIGHT = ['#9aa59f', '#8d7f88', '#9a8a54', '#7c7299']

/** Hill profile shared with the ground mound in TreeCanvas. */
export function groundAt(x: number, w: number, groundY: number) {
  const u = (x - w / 2) / (w / 2)
  return groundY + 14 - 16 * (1 - u * u)
}

export function drawFlowers(ctx: CanvasRenderingContext2D, w: number, h: number, groundY: number, t: number, amount: number, night: boolean, wind: number) {
  const n = Math.round(FLOWERS.length * Math.min(1, amount))
  for (let i = 0; i < n; i++) {
    const f = FLOWERS[i]
    const x = f.x * w
    // keep the flowers off the trunk area
    if (Math.abs(x - w / 2) < 26) continue
    const base = groundAt(x, w, groundY) + 4 + f.y * (h - groundY) * 0.55
    const sway = Math.sin(t * 1.2 + f.ph) * 1.5 * wind
    ctx.strokeStyle = night ? 'rgba(90,120,95,0.7)' : 'rgba(110,140,80,0.8)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, base)
    ctx.quadraticCurveTo(x + sway * 0.4, base - 4, x + sway, base - 7 * f.s)
    ctx.stroke()
    ctx.fillStyle = (night ? FLOWER_NIGHT : FLOWER_COLORS)[f.c]
    const cx = x + sway
    const cy = base - 7 * f.s
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx + Math.cos(a) * 1.6 * f.s, cy + Math.sin(a) * 1.6 * f.s, 1.3 * f.s, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = night ? '#a08a4a' : '#e8b33c'
    ctx.beginPath()
    ctx.arc(cx, cy, 0.9 * f.s, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function drawBrook(ctx: CanvasRenderingContext2D, w: number, h: number, groundY: number, t: number, night: boolean, reveal: number) {
  // a gentle S-curve entering from the left edge and fading into the foreground
  const pts: [number, number][] = []
  const N = 24
  for (let i = 0; i <= N; i++) {
    const u = i / N
    const x = -10 + u * w * 0.62
    const y = groundY + 10 + u * (h - groundY) * 0.85 + Math.sin(u * Math.PI * 1.6) * 10
    pts.push([x, y])
  }
  const width = (u: number) => (3 + u * 16) * reveal
  ctx.save()
  const water = night ? 'rgba(80,120,140,0.65)' : 'rgba(150,196,206,0.85)'
  ctx.fillStyle = water
  ctx.beginPath()
  pts.forEach(([x, y], i) => {
    const u = i / N
    if (i === 0) ctx.moveTo(x, y - width(u) / 2)
    else ctx.lineTo(x, y - width(u) / 2)
  })
  for (let i = N; i >= 0; i--) {
    const [x, y] = pts[i]
    ctx.lineTo(x, y + width(i / N) / 2)
  }
  ctx.closePath()
  ctx.fill()
  // glints travelling downstream
  ctx.strokeStyle = night ? 'rgba(200,230,240,0.35)' : 'rgba(255,255,255,0.75)'
  ctx.lineWidth = 1.2
  ctx.lineCap = 'round'
  for (let k = 0; k < 6; k++) {
    const u = ((t * 0.05 + k / 6) % 1) * 0.95
    const i = Math.floor(u * N)
    const [x, y] = pts[i]
    const len = 3 + u * 6
    ctx.globalAlpha = Math.sin(u * Math.PI) * reveal
    ctx.beginPath()
    ctx.moveTo(x - len / 2, y + Math.sin(t * 2 + k) * width(u) * 0.2)
    ctx.lineTo(x + len / 2, y + Math.sin(t * 2 + k) * width(u) * 0.2)
    ctx.stroke()
  }
  ctx.restore()
}

/** Two small birds perched in the crown; now and then one hops. */
export function drawBirds(ctx: CanvasRenderingContext2D, perches: [number, number][], t: number, night: boolean) {
  perches.slice(0, 2).forEach(([x, y], i) => {
    const hop = Math.max(0, Math.sin(t * 0.9 + i * 2.3)) ** 24 * 5
    const by = y - 4 - hop
    const dir = i % 2 ? -1 : 1
    ctx.save()
    ctx.translate(x, by)
    ctx.scale(dir, 1)
    ctx.fillStyle = night ? '#3a3f45' : '#5b4a3e'
    ctx.beginPath()
    ctx.ellipse(0, 0, 5.2, 3.6, -0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(4.2, -2.6, 2.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = night ? '#6e5a50' : '#c76a4a'
    ctx.beginPath()
    ctx.ellipse(1.6, 1, 2.6, 1.8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#e8b33c'
    ctx.beginPath()
    ctx.moveTo(6.4, -2.8)
    ctx.lineTo(8.6, -2.2)
    ctx.lineTo(6.4, -1.8)
    ctx.fill()
    ctx.strokeStyle = night ? '#3a3f45' : '#5b4a3e'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(-4.5, -0.5)
    ctx.lineTo(-8, 1.5)
    ctx.stroke()
    ctx.restore()
  })
}

export function drawLantern(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, night: boolean) {
  const flicker = 0.85 + 0.15 * Math.sin(t * 7.3) * Math.sin(t * 3.1)
  const glow = ctx.createRadialGradient(x, y - 10, 0, x, y - 10, night ? 60 : 26)
  glow.addColorStop(0, `rgba(255,205,120,${(night ? 0.55 : 0.25) * flicker})`)
  glow.addColorStop(1, 'rgba(255,205,120,0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(x, y - 10, night ? 60 : 26, 0, Math.PI * 2)
  ctx.fill()
  // post
  ctx.fillStyle = night ? '#2c2622' : '#4a3b30'
  ctx.fillRect(x - 1.2, y - 6, 2.4, 10)
  // body
  ctx.fillStyle = night ? '#3b322b' : '#5a4636'
  ctx.fillRect(x - 5, y - 19, 10, 2)
  ctx.fillRect(x - 4.5, y - 7, 9, 1.6)
  ctx.fillStyle = `rgba(255,214,140,${0.9 * flicker})`
  ctx.fillRect(x - 3.8, y - 17, 7.6, 10)
  ctx.strokeStyle = night ? '#3b322b' : '#5a4636'
  ctx.lineWidth = 1
  ctx.strokeRect(x - 3.8, y - 17, 7.6, 10)
  ctx.beginPath()
  ctx.moveTo(x, y - 17)
  ctx.lineTo(x, y - 7)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x, y - 21, 2.2, Math.PI, 0)
  ctx.stroke()
}
