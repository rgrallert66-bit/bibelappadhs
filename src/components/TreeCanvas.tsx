import { useEffect, useMemo, useRef } from 'react'
import { generateTree, pose, fruitSlots, maturity, type Branch, type Pose } from '../lib/tree'
import { rng } from '../lib/random'
import type { Season } from '../lib/dates'
import type { Stage } from '../lib/fsrs'

export interface Fruit {
  id: string
  stage: Stage
}

export type SkyMode = 'dawn' | 'day' | 'golden' | 'night'

interface Props {
  /** Learning days (may be fractional while animating). */
  age: number
  fruits: Fruit[]
  golden: number
  season: Season
  sky: SkyMode
  highlight?: string | null
  onFruit?: (id: string) => void
  /** Called with an incrementing counter when new branches appear during growth. */
  className?: string
  /** 0..1 extra glow while growing */
  glow?: number
  compact?: boolean
}

const SKIES: Record<SkyMode, { top: string; mid: string; halo: string; hill1: string; hill2: string; ground: string; mote: string }> = {
  dawn: { top: '#e9d3c4', mid: '#f3e6da', halo: 'rgba(255,214,170,0.55)', hill1: '#d9d2bd', hill2: '#cbc6ad', ground: '#b9bc97', mote: '255,236,200' },
  day: { top: '#c9dfe0', mid: '#ebeee4', halo: 'rgba(255,246,214,0.7)', hill1: '#d3dbc8', hill2: '#c0ccb0', ground: '#a9b98f', mote: '255,250,226' },
  golden: { top: '#ecd0a6', mid: '#f4e7d1', halo: 'rgba(255,205,130,0.6)', hill1: '#dccdb0', hill2: '#cdbe98', ground: '#b5ad84', mote: '255,222,160' },
  night: { top: '#0b1720', mid: '#12211f', halo: 'rgba(170,200,190,0.16)', hill1: '#15241f', hill2: '#192b24', ground: '#1d3129', mote: '230,240,170' },
}

const LEAVES: Record<Season, string[]> = {
  spring: ['#7fb069', '#93c47d', '#6fa45d', '#a9d18e', '#f2d4dc', '#fbe6ea'],
  summer: ['#4f8a4a', '#5f9a52', '#3f7a43', '#6ea75c', '#4a8547', '#79b064'],
  autumn: ['#8aa04f', '#c9a13c', '#d98b3a', '#b8642f', '#e0b54b', '#9c7c3a'],
  winter: ['#3f6b55', '#4d7a62', '#5d8a70', '#d9e4e0', '#36604b', '#e9efec'],
}
const LEAVES_NIGHT: Record<Season, string[]> = {
  spring: ['#3e6b45', '#4b7a50', '#36603c', '#5a8a5b', '#8a7a86', '#9b8c98'],
  summer: ['#2f5a3b', '#386644', '#284f34', '#41704b', '#2e5739', '#487a52'],
  autumn: ['#4f6339', '#7a6630', '#8a5a2e', '#734326', '#8f7536', '#5e4e2c'],
  winter: ['#284a3b', '#2f5444', '#365c4b', '#7d8e8a', '#244236', '#9aa8a4'],
}

export default function TreeCanvas({ age, fruits, golden, season, sky, highlight, onFruit, className, glow = 0, compact }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tree = useMemo(() => generateTree(7), [])
  const leafSeeds = useMemo(() => {
    const r = rng(99)
    return tree.map(() => Array.from({ length: 16 }, () => [r(), r(), r(), r()] as const))
  }, [tree])

  // live props for the animation loop
  const live = useRef({ age, fruits, golden, season, sky, highlight, glow, onFruit, compact })
  live.current = { age, fruits, golden, season, sky, highlight, glow, onFruit, compact }
  const gust = useRef(0)
  const fruitHits = useRef<{ id: string; x: number; y: number }[]>([])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let w = 0
    let h = 0
    let dpr = 1
    let lastAge = -1
    let cam = { scale: 1, cx: 0, base: 0 }
    const motes = Array.from({ length: 16 }, (_, i) => {
      const r = rng(500 + i)
      return { x: r(), y: r(), s: 0.6 + r() * 1.6, sp: 0.15 + r() * 0.35, ph: r() * Math.PI * 2 }
    })
    const sparks: { x: number; y: number; vx: number; vy: number; life: number; s: number }[] = []
    const stars = Array.from({ length: 40 }, (_, i) => {
      const r = rng(900 + i)
      return { x: r(), y: r() * 0.5, s: 0.4 + r() * 1.1, ph: r() * 6 }
    })

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(2, window.devicePixelRatio || 1)
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      lastAge = -1
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (document.hidden || !w || !h) return
      const t = now / 1000
      const L = live.current
      const S = SKIES[L.sky]
      const night = L.sky === 'night'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // ---------- framing (computed only when age changes) ----------
      const groundY = h * (L.compact ? 0.9 : 0.84)
      if (Math.abs(L.age - lastAge) > 1e-4) {
        lastAge = L.age
        const still = pose(tree, Math.max(0.05, L.age))
        let minX = -1, maxX = 1, minY = -1
        for (const p of still) {
          if (!p) continue
          minX = Math.min(minX, p.x1, p.cx)
          maxX = Math.max(maxX, p.x1, p.cx)
          minY = Math.min(minY, p.y1)
        }
        const treeH = -minY * 1.12
        const treeW = Math.max(maxX, -minX) * 2 * 1.15
        const want = (0.3 + 0.6 * maturity(L.age)) * groundY
        const scale = Math.min(want / treeH, (w * 0.94) / treeW, 40)
        cam = { scale, cx: w / 2, base: groundY }
      }
      const { scale } = cam

      // ---------- sky ----------
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, S.top)
      g.addColorStop(0.62, S.mid)
      g.addColorStop(1, S.mid)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      if (night) {
        for (const s of stars) {
          const a = 0.35 + 0.35 * Math.sin(t * 1.3 + s.ph)
          ctx.fillStyle = `rgba(240,236,220,${a})`
          ctx.beginPath()
          ctx.arc(s.x * w, s.y * h, s.s, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // halo of light behind the crown
      const haloY = groundY - Math.min(groundY * 0.55, 60 + 300 * maturity(L.age))
      const haloR = Math.max(w, h) * (0.45 + 0.1 * Math.sin(t * 0.4)) * (1 + L.glow * 0.4)
      const hg = ctx.createRadialGradient(w / 2, haloY, 0, w / 2, haloY, haloR)
      hg.addColorStop(0, S.halo)
      hg.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = hg
      ctx.fillRect(0, 0, w, h)

      // distant hills
      ctx.fillStyle = S.hill1
      ctx.beginPath()
      ctx.moveTo(0, groundY - h * 0.08)
      ctx.bezierCurveTo(w * 0.25, groundY - h * 0.16, w * 0.45, groundY - h * 0.04, w * 0.7, groundY - h * 0.1)
      ctx.bezierCurveTo(w * 0.85, groundY - h * 0.13, w * 0.95, groundY - h * 0.09, w, groundY - h * 0.1)
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.fill()
      ctx.fillStyle = S.hill2
      ctx.beginPath()
      ctx.moveTo(0, groundY - h * 0.02)
      ctx.bezierCurveTo(w * 0.2, groundY - h * 0.06, w * 0.6, groundY - h * 0.01, w, groundY - h * 0.05)
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.fill()

      // ground mound
      ctx.fillStyle = S.ground
      ctx.beginPath()
      ctx.moveTo(-10, groundY + 14)
      ctx.quadraticCurveTo(w / 2, groundY - 16, w + 10, groundY + 14)
      ctx.lineTo(w + 10, h)
      ctx.lineTo(-10, h)
      ctx.fill()

      // ---------- tree ----------
      gust.current *= 0.985
      const wind = 0.6 + gust.current
      const sway = (b: Branch) => {
        if (b.depth === 0) return Math.sin(t * 0.7) * 0.004 * wind
        return (
          (Math.sin(t * (0.8 + b.seed * 0.5) + b.seed * 9) * 0.012 + Math.sin(t * 2.1 + b.seed * 20) * 0.004) *
          Math.pow(b.depth, 0.8) *
          wind
        )
      }
      const poses = pose(tree, Math.max(0.05, L.age), sway)
      const X = (x: number) => cam.cx + x * scale
      const Y = (y: number) => cam.base - 4 + y * scale

      // shadow on the ground
      const shW = Math.min(w * 0.42, 30 + 200 * maturity(L.age) * scale)
      const sg = ctx.createRadialGradient(cam.cx, groundY, 0, cam.cx, groundY, shW)
      sg.addColorStop(0, night ? 'rgba(0,0,0,0.35)' : 'rgba(60,50,30,0.22)')
      sg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = sg
      ctx.save()
      ctx.translate(cam.cx, groundY)
      ctx.scale(1, 0.18)
      ctx.translate(-cam.cx, -groundY)
      ctx.beginPath()
      ctx.arc(cam.cx, groundY, shW, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      const bark = night ? '#3b3129' : '#5a4636'
      const barkLight = night ? '#5a4c40' : '#7d6650'
      const twig = night ? '#4a4038' : '#76624d'

      // branches – thick ones as tapered shapes, thin ones as strokes
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (let i = 0; i < poses.length; i++) {
        const p = poses[i]
        if (!p) continue
        const wpx = p.width * scale
        if (wpx < 2.2) continue
        drawTapered(ctx, p, X, Y, wpx, endWidth(tree, poses, i) * scale, bark)
      }
      ctx.strokeStyle = twig
      for (let i = 0; i < poses.length; i++) {
        const p = poses[i]
        if (!p) continue
        const wpx = p.width * scale
        if (wpx >= 2.2) continue
        ctx.lineWidth = Math.max(0.7, wpx)
        ctx.beginPath()
        ctx.moveTo(X(p.x0), Y(p.y0))
        ctx.quadraticCurveTo(X(p.cx), Y(p.cy), X(p.x1), Y(p.y1))
        ctx.stroke()
      }
      // bark highlight on thick limbs
      ctx.strokeStyle = barkLight
      ctx.globalAlpha = 0.22
      for (let i = 0; i < poses.length; i++) {
        const p = poses[i]
        if (!p) continue
        const wpx = p.width * scale
        if (wpx < 5) continue
        const off = -wpx * 0.22
        const nx = Math.cos(p.angle) * off
        const ny = Math.sin(p.angle) * off
        ctx.lineWidth = wpx * 0.18
        ctx.beginPath()
        ctx.moveTo(X(p.x0) + nx, Y(p.y0) + ny)
        ctx.quadraticCurveTo(X(p.cx) + nx, Y(p.cy) + ny, X(p.x1) + nx * 0.6, Y(p.y1) + ny * 0.6)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      // ---------- leaves ----------
      const palette = night ? LEAVES_NIGHT[L.season] : LEAVES[L.season]
      const leafPx = Math.max(4.2, Math.min(15, 8.5 * scale))
      const paths = palette.map(() => new Path2D())
      const goldPath = new Path2D()
      const seedPath = new Path2D()
      let goldLeft = L.golden
      let leafIndex = 0
      for (let i = 0; i < poses.length; i++) {
        const p = poses[i]
        const b = tree[i]
        if (!p || (p.g < 0.15 && b.depth > 0)) continue
        const grownKids = b.children.filter((c) => poses[c] && poses[c].g > 0.4).length
        const isTip = grownKids === 0
        if (b.depth === 0 && !isTip) continue
        if (b.depth === 1 && !isTip) continue
        const lush = 1 + 0.9 * Math.max(0, 1 - L.age / 70)
        const count = (isTip ? Math.max(5, b.leaves + 4) : Math.max(0, b.leaves - 2)) * lush
        // a seedling shows its first leaves right away
        const n = b.depth === 0 ? Math.min(6, 3 + Math.floor(L.age * 1.5)) : Math.round(count * Math.min(1, p.g * 1.3))
        const seeds = leafSeeds[i]
        for (let k = 0; k < n && k < seeds.length; k++) {
          const [r1, r2, r3, r4] = seeds[k]
          const tt = b.depth === 0 && isTip ? 0.5 + r1 * 0.45 : isTip ? 0.55 + r1 * 0.5 : 0.35 + r1 * 0.6
          const bx = (1 - tt) * (1 - tt) * p.x0 + 2 * (1 - tt) * tt * p.cx + tt * tt * p.x1
          const by = (1 - tt) * (1 - tt) * p.y0 + 2 * (1 - tt) * tt * p.cy + tt * tt * p.y1
          const side = r2 < 0.5 ? -1 : 1
          const ang = p.angle + side * (0.5 + r3 * 0.9) + Math.sin(t * 1.7 + r4 * 10) * 0.12 * wind
          const size = b.depth === 0 ? Math.max(15, leafPx) * (1.05 + r4 * 0.45) : leafPx * (0.65 + r4 * 0.6) * (0.5 + 0.5 * p.g)
          const sx = X(bx)
          const sy = Y(by)
          leafIndex++
          const isGold = goldLeft > 0 && (leafIndex * 7919) % 11 === 0
          if (isGold) goldLeft--
          const path = isGold ? goldPath : b.depth === 0 ? seedPath : paths[Math.floor(r2 * 997 + r3 * 31) % palette.length]
          leafShape(path, sx, sy, ang, size)
        }
      }
      for (let c = 0; c < palette.length; c++) {
        ctx.fillStyle = palette[c]
        ctx.fill(paths[c])
      }
      ctx.fillStyle = night ? '#4f8a55' : '#7cbf62'
      ctx.fill(seedPath)
      if (L.golden > 0) {
        ctx.save()
        ctx.shadowColor = 'rgba(255,200,90,0.9)'
        ctx.shadowBlur = 8
        ctx.fillStyle = '#e9bf55'
        ctx.fill(goldPath)
        ctx.restore()
      }

      // ---------- verse fruits ----------
      let slots = fruitSlots(tree, Math.max(0.05, L.age)).filter((id) => poses[id])
      if (!slots.length) slots = [0]
      const hits: { id: string; x: number; y: number }[] = []
      const used = new Map<number, number>()
      L.fruits.forEach((f, i) => {
        const slot = slots[i % slots.length]
        const k = used.get(slot) ?? 0
        used.set(slot, k + 1)
        const p = poses[slot]
        if (!p) return
        const tt = Math.max(0.35, 1 - k * 0.2)
        const bx = (1 - tt) * (1 - tt) * p.x0 + 2 * (1 - tt) * tt * p.cx + tt * tt * p.x1
        const by = (1 - tt) * (1 - tt) * p.y0 + 2 * (1 - tt) * tt * p.cy + tt * tt * p.y1
        const hang = 7 + (i % 3) * 2
        const sx = X(bx) + Math.sin(t * 1.4 + i) * 1.2
        const sy = Y(by) + hang
        drawFruit(ctx, sx, sy, X(bx), Y(by), f.stage, t, i, f.id === L.highlight, night)
        hits.push({ id: f.id, x: sx, y: sy })
      })
      fruitHits.current = hits

      // ---------- growth sparks: light rising from the crown ----------
      if (L.glow > 0.02) {
        if (Math.random() < L.glow * 0.9) {
          const tips = poses.filter((p, i) => p && tree[i].depth >= Math.min(2, tree[i].depth))
          const p = tips[Math.floor(Math.random() * tips.length)]
          if (p) sparks.push({ x: X(p.x1), y: Y(p.y1), vx: (Math.random() - 0.5) * 14, vy: -18 - Math.random() * 26, life: 1, s: 1 + Math.random() * 2 })
        }
      }
      for (let k = sparks.length - 1; k >= 0; k--) {
        const sp = sparks[k]
        sp.life -= 0.012
        sp.x += sp.vx * 0.016
        sp.y += sp.vy * 0.016
        if (sp.life <= 0) {
          sparks.splice(k, 1)
          continue
        }
        ctx.save()
        ctx.globalAlpha = Math.min(1, sp.life * 1.4)
        ctx.shadowColor = 'rgba(255,214,120,0.95)'
        ctx.shadowBlur = 8
        ctx.fillStyle = '#ffe7a3'
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, sp.s, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // ---------- motes / fireflies ----------
      for (const m of motes) {
        const mx = ((m.x + Math.sin(t * 0.07 * m.sp + m.ph) * 0.08) % 1) * w
        const my = (((m.y - t * 0.012 * m.sp) % 1) + 1) % 1 * groundY
        const a = (night ? 0.75 : 0.5) * (0.5 + 0.5 * Math.sin(t * (night ? 2.2 : 0.8) + m.ph))
        ctx.fillStyle = `rgba(${S.mote},${a})`
        if (night) {
          ctx.save()
          ctx.shadowColor = `rgba(${S.mote},0.9)`
          ctx.shadowBlur = 6
        }
        ctx.beginPath()
        ctx.arc(mx, my, m.s * (night ? 1.3 : 1), 0, Math.PI * 2)
        ctx.fill()
        if (night) ctx.restore()
      }

      // a few grass blades on the mound
      ctx.strokeStyle = night ? 'rgba(90,120,95,0.6)' : 'rgba(110,135,80,0.55)'
      ctx.lineWidth = 1.2
      for (let i = 0; i < 26; i++) {
        const gx = (i / 26) * w + ((i * 37) % 11)
        const gy = groundY + 14 - 16 * (1 - Math.pow((gx - w / 2) / (w / 2), 2)) + 2
        const bend = Math.sin(t * 1.3 + i) * 2 * wind
        ctx.beginPath()
        ctx.moveTo(gx, gy)
        ctx.quadraticCurveTo(gx + bend * 0.5, gy - 5, gx + bend, gy - 8 - (i % 4) * 2)
        ctx.stroke()
      }
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [tree, leafSeeds])

  const onPointer = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    let best: { id: string; d: number } | null = null
    for (const h of fruitHits.current) {
      const d = Math.hypot(h.x - x, h.y - y)
      if (d < 26 && (!best || d < best.d)) best = { id: h.id, d }
    }
    if (best && onFruit) onFruit(best.id)
    else gust.current = Math.min(3, gust.current + 1.6)
  }

  return <canvas ref={canvasRef} className={className} onPointerDown={onPointer} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'manipulation' }} />
}

function endWidth(tree: Branch[], poses: Pose[], i: number) {
  const p = poses[i]
  let max = 0
  for (const c of tree[i].children) if (poses[c]) max = Math.max(max, poses[c].width)
  return Math.max(p.width * 0.45, max * 0.95 || p.width * 0.35)
}

function drawTapered(
  ctx: CanvasRenderingContext2D,
  p: Pose,
  X: (x: number) => number,
  Y: (y: number) => number,
  w0: number,
  w1: number,
  color: string,
) {
  const N = 8
  const left: [number, number][] = []
  const right: [number, number][] = []
  for (let k = 0; k <= N; k++) {
    const t = k / N
    const x = (1 - t) * (1 - t) * p.x0 + 2 * (1 - t) * t * p.cx + t * t * p.x1
    const y = (1 - t) * (1 - t) * p.y0 + 2 * (1 - t) * t * p.cy + t * t * p.y1
    const dx = 2 * (1 - t) * (p.cx - p.x0) + 2 * t * (p.x1 - p.cx)
    const dy = 2 * (1 - t) * (p.cy - p.y0) + 2 * t * (p.y1 - p.cy)
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    // root flare at the very base of the trunk
    const flare = p.x0 === 0 && p.y0 === 0 ? 1 + Math.pow(1 - t, 6) * 0.9 : 1
    const ww = ((1 - t) * w0 + t * w1) * 0.5 * flare
    left.push([X(x) + nx * ww, Y(y) + ny * ww])
    right.push([X(x) - nx * ww, Y(y) - ny * ww])
  }
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(left[0][0], left[0][1])
  for (const [x, y] of left) ctx.lineTo(x, y)
  for (let k = right.length - 1; k >= 0; k--) ctx.lineTo(right[k][0], right[k][1])
  ctx.closePath()
  ctx.fill()
  // round cap at the tip
  ctx.beginPath()
  ctx.arc(X(p.x1), Y(p.y1), Math.max(0.5, w1 * 0.5), 0, Math.PI * 2)
  ctx.fill()
}

function leafShape(path: Path2D, x: number, y: number, ang: number, size: number) {
  const ca = Math.cos(ang)
  const sa = Math.sin(ang)
  const tip = (dx: number, dy: number): [number, number] => [x + dx * ca - dy * sa, y + dx * sa + dy * ca]
  // almond leaf pointing along -y in local space
  const [ax, ay] = tip(0, 0)
  const [bx, by] = tip(0, -size)
  const [c1x, c1y] = tip(size * 0.42, -size * 0.5)
  const [c2x, c2y] = tip(-size * 0.42, -size * 0.5)
  path.moveTo(ax, ay)
  path.quadraticCurveTo(c1x, c1y, bx, by)
  path.quadraticCurveTo(c2x, c2y, ax, ay)
  path.closePath()
}

function drawFruit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ax: number,
  ay: number,
  stage: Stage,
  t: number,
  i: number,
  hl: boolean,
  night: boolean,
) {
  // stem
  ctx.strokeStyle = night ? 'rgba(120,110,90,0.8)' : 'rgba(90,70,50,0.7)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(ax, ay)
  ctx.lineTo(x, y - 3)
  ctx.stroke()

  if (hl) {
    const r = 15 + Math.sin(t * 3) * 3
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8)
    g.addColorStop(0, 'rgba(255,230,160,0.75)')
    g.addColorStop(1, 'rgba(255,230,160,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r * 1.8, 0, Math.PI * 2)
    ctx.fill()
  }

  switch (stage) {
    case 0:
    case 1: {
      // tiny sprout: seed bud with a leaf
      ctx.fillStyle = '#9ccf7a'
      ctx.beginPath()
      ctx.ellipse(x, y, 3.6, 4.4, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#6fae55'
      ctx.beginPath()
      ctx.ellipse(x + 3, y - 3, 3.2, 1.6, -0.6, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 2: {
      ctx.fillStyle = '#5fa25a'
      ctx.beginPath()
      ctx.ellipse(x - 3.5, y - 2, 4.2, 2, 0.5, 0, Math.PI * 2)
      ctx.ellipse(x + 3.5, y - 2, 4.2, 2, -0.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#b6dc8e'
      ctx.beginPath()
      ctx.ellipse(x, y + 1, 4, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 3: {
      ctx.fillStyle = '#5f9a55'
      ctx.beginPath()
      ctx.ellipse(x, y - 3, 3, 2.4, 0, 0, Math.PI * 2)
      ctx.fill()
      const g = ctx.createLinearGradient(x, y - 6, x, y + 7)
      g.addColorStop(0, '#f6c6cf')
      g.addColorStop(1, '#d9788c')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(x, y + 7)
      ctx.bezierCurveTo(x + 7, y + 3, x + 4, y - 5, x, y - 5)
      ctx.bezierCurveTo(x - 4, y - 5, x - 7, y + 3, x, y + 7)
      ctx.fill()
      break
    }
    case 4: {
      const rot = Math.sin(t * 0.6 + i) * 0.1
      for (let k = 0; k < 5; k++) {
        const a = rot + (k / 5) * Math.PI * 2
        ctx.fillStyle = k % 2 ? '#fde7ec' : '#fbd6de'
        ctx.beginPath()
        ctx.ellipse(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 5.2, 3.6, a, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#e8b33c'
      ctx.beginPath()
      ctx.arc(x, y, 2.6, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 5: {
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.6 + i)
      const halo = ctx.createRadialGradient(x, y, 2, x, y, 18)
      halo.addColorStop(0, `rgba(255,214,120,${0.35 + pulse * 0.25})`)
      halo.addColorStop(1, 'rgba(255,214,120,0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(x, y, 18, 0, Math.PI * 2)
      ctx.fill()
      const g = ctx.createRadialGradient(x - 2.5, y - 3, 1, x, y, 9)
      g.addColorStop(0, '#fff2bf')
      g.addColorStop(0.45, '#f2c14e')
      g.addColorStop(1, '#c88a1e')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y + 1, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#5f8f4a'
      ctx.beginPath()
      ctx.ellipse(x + 3.5, y - 7, 4, 1.8, -0.5, 0, Math.PI * 2)
      ctx.fill()
      break
    }
  }
}
