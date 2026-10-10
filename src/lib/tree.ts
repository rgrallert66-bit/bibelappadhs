import { rng } from './random'

/**
 * The living tree.
 *
 * A complete, mature skeleton is generated once from a seed. Every branch has a
 * birth "age" (in learning days). Rendering at age A shows each branch born before A,
 * grown proportionally – so the tree changes a little every learning day, a lot over
 * weeks, and keeps developing for years (later generations are born ever more slowly).
 */

export interface Branch {
  id: number
  parent: number
  depth: number
  /** Angle relative to the parent's direction (radians). */
  rel: number
  /** Full length when mature (world units). */
  length: number
  /** Position along the parent where the branch sprouts (0–1). */
  at: number
  /** Learning day on which the branch starts to grow. */
  born: number
  /** Days it takes to reach full length. */
  grow: number
  /** Gentle bend of the branch (curvature). */
  bend: number
  children: number[]
  /** Leaf cluster count when mature. */
  leaves: number
  seed: number
}

/** Learning days at which each branch generation begins. Grows sub-linearly forever. */
export const GENERATION_DAYS = [0, 2, 5, 11, 22, 42, 80, 150, 270, 480, 800]
export const MAX_DEPTH = 9

export function generateTree(seed = 7): Branch[] {
  const rand = rng(seed)
  const branches: Branch[] = []
  const add = (b: Omit<Branch, 'id' | 'children'>) => {
    const id = branches.length
    branches.push({ ...b, id, children: [] })
    if (b.parent >= 0) branches[b.parent].children.push(id)
    return id
  }
  add({ parent: -1, depth: 0, rel: 0, length: 120, at: 0, born: 0, grow: 40, bend: 0.04, leaves: 0, seed: rand() })

  const grow = (pid: number) => {
    const p = branches[pid]
    if (p.depth >= MAX_DEPTH) return
    const d = p.depth + 1
    const g0 = GENERATION_DAYS[d]
    const g1 = GENERATION_DAYS[d + 1] ?? g0 * 1.7
    // the trunk sprouts several main limbs; later generations fork 2–3 ways
    const n = p.depth === 0 ? 4 : d >= 7 ? (rand() < 0.55 ? 2 : 1) : rand() < 0.3 ? 3 : 2
    for (let k = 0; k < n; k++) {
      const side = n === 1 ? (rand() < 0.5 ? -1 : 1) : (k / (n - 1)) * 2 - 1
      const spread = p.depth === 0 ? 0.62 : 0.5 - d * 0.015
      const rel = side * spread * (0.75 + rand() * 0.5) + (rand() - 0.5) * 0.25
      const at = p.depth === 0 ? 0.42 + (k / Math.max(1, n - 1)) * 0.5 + (rand() - 0.5) * 0.08 : 0.55 + rand() * 0.45
      const length = p.length * (p.depth === 0 ? 0.62 : 0.74 + rand() * 0.12) * (1 - Math.abs(side) * 0.12)
      const born = g0 + (g1 - g0) * (0.15 * k + rand() * 0.55) * (p.depth === 0 ? 0.6 : 1)
      add({
        parent: pid,
        depth: d,
        rel,
        length,
        at: Math.min(1, at),
        born: Math.max(p.born + 0.5, born),
        grow: (g1 - g0) * 0.9 + 1,
        bend: (rand() - 0.5) * 0.35,
        leaves: d >= 2 ? Math.round(2 + rand() * 3 + d * 0.6) : 0,
        seed: rand(),
      })
    }
    for (const c of branches[pid].children) grow(c)
  }
  grow(0)
  return branches
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/** How far the branch has grown at a given age (0–1). */
export function growth(b: Branch, age: number): number {
  if (age <= b.born) return 0
  return easeOutCubic(Math.min(1, (age - b.born) / b.grow))
}

/** Overall maturity 0–1 – used for camera framing and trunk character. */
export function maturity(age: number): number {
  return Math.min(1, Math.log1p(age) / Math.log1p(900))
}

export interface Pose {
  x0: number
  y0: number
  x1: number
  y1: number
  /** control point for the curve */
  cx: number
  cy: number
  angle: number
  len: number
  width: number
  g: number
}

/**
 * Computes world positions at a given age. `sway(b)` returns an extra angle for wind.
 * Thickness follows the pipe model: a branch is as thick as the sum of what it carries.
 */
export function pose(tree: Branch[], age: number, sway: (b: Branch) => number = () => 0): Pose[] {
  const poses: Pose[] = new Array(tree.length)
  // thickness bottom-up
  const load = new Array(tree.length).fill(0)
  for (let i = tree.length - 1; i >= 0; i--) {
    const b = tree[i]
    const g = growth(b, age)
    if (g <= 0) continue
    let sum = 0
    for (const c of b.children) sum += load[c]
    load[i] = Math.max(g * 0.35, sum) + g * 0.1
  }
  const visit = (id: number, x: number, y: number, parentAngle: number) => {
    const b = tree[id]
    const g = growth(b, age)
    if (g <= 0) return
    const angle = parentAngle + b.rel * (0.6 + 0.4 * g) + sway(b)
    // trunk grows taller with age even after reaching its base length
    const len = b.depth === 0 ? b.length * (0.08 + 0.6 * g + 0.5 * maturity(age)) : b.length * g
    const x1 = x + Math.sin(angle) * len
    const y1 = y - Math.cos(angle) * len
    const mid = angle + b.bend
    const cx = x + Math.sin(mid) * len * 0.55
    const cy = y - Math.cos(mid) * len * 0.55
    // pipe model, softened; young trees stay slender, old ones gain girth
    const k = 0.02 + 0.23 * Math.pow(maturity(age), 1.5)
    const width = Math.max(0.06, Math.min(2.2 * Math.pow(load[id], 0.45), len * k + 0.35 * maturity(age)))
    poses[id] = { x0: x, y0: y, x1, y1, cx, cy, angle, len, width, g }
    for (const c of b.children) {
      const cb = tree[c]
      // attach point along the (quadratic) curve
      const t = cb.at
      const ax = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * cx + t * t * x1
      const ay = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cy + t * t * y1
      visit(c, ax, ay, angle)
    }
  }
  visit(0, 0, 0, 0)
  return poses
}

/**
 * Where verse fruits hang. Ordered so consecutive verses are spread around the crown.
 * Early on (few branches) several verses share the young stem.
 */
export function fruitSlots(tree: Branch[], age: number): number[] {
  const alive = tree.filter((b) => growth(b, age) > 0.35 && b.depth >= 1)
  const tips = alive.filter((b) => b.depth >= 2 || alive.length < 8)
  const sorted = tips.sort((a, b) => a.born - b.born || a.seed - b.seed)
  return sorted.map((b) => b.id)
}
