/**
 * Sound & touch feedback. All sounds are synthesised (no samples): soft, short,
 * tuned to a pentatonic scale so consecutive correct answers form a gentle melody
 * that rises with the combo. Quiet by design – premium, never arcade.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let wet: ConvolverNode | null = null
let enabled = true
let hapticsOn = true

export function setSound(on: boolean) {
  enabled = on
}
export function setHaptics(on: boolean) {
  hapticsOn = on
}

function impulse(ac: AudioContext, seconds = 1.6) {
  const len = Math.floor(ac.sampleRate * seconds)
  const buf = ac.createBuffer(2, len, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2)
  }
  return buf
}

function audio(): AudioContext | null {
  if (!enabled) return null
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.55
    const comp = ctx.createDynamicsCompressor()
    master.connect(comp)
    comp.connect(ctx.destination)
    wet = ctx.createConvolver()
    wet.buffer = impulse(ctx)
    const wetGain = ctx.createGain()
    wetGain.gain.value = 0.22
    wet.connect(wetGain)
    wetGain.connect(master)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Unlock audio on first user gesture (iOS). */
export function primeAudio() {
  audio()
}

// C major pentatonic, two octaves from C5
const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0, 2093.0]

function tone(freq: number, opts: { at?: number; dur?: number; gain?: number; type?: OscillatorType; bell?: boolean } = {}) {
  const ac = audio()
  if (!ac || !master || !wet) return
  const t = ac.currentTime + (opts.at ?? 0)
  const dur = opts.dur ?? 0.35
  const g = ac.createGain()
  const peak = opts.gain ?? 0.09
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  const o = ac.createOscillator()
  o.type = opts.type ?? 'sine'
  o.frequency.setValueAtTime(freq, t)
  o.connect(g)
  if (opts.bell) {
    // a quiet inharmonic partial gives a glassy, "kalimba" timbre
    const o2 = ac.createOscillator()
    const g2 = ac.createGain()
    o2.frequency.value = freq * 2.76
    g2.gain.setValueAtTime(peak * 0.18, t)
    g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.4)
    o2.connect(g2)
    g2.connect(master)
    g2.connect(wet)
    o2.start(t)
    o2.stop(t + dur)
  }
  g.connect(master)
  g.connect(wet)
  o.start(t)
  o.stop(t + dur + 0.05)
}

export const sfx = {
  tap() {
    tone(1400, { dur: 0.05, gain: 0.025, type: 'triangle' })
  },
  correct(combo: number) {
    const i = Math.min(SCALE.length - 1, combo % 8 + Math.floor(combo / 8) * 2)
    tone(SCALE[Math.max(0, i)], { dur: 0.42, gain: 0.075, bell: true })
  },
  wrong() {
    tone(196, { dur: 0.18, gain: 0.07, type: 'sine' })
    tone(185, { at: 0.07, dur: 0.2, gain: 0.05, type: 'sine' })
  },
  place() {
    tone(880, { dur: 0.12, gain: 0.04, type: 'triangle' })
  },
  verse() {
    ;[0, 2, 4, 7].forEach((n, k) => tone(SCALE[n] , { at: k * 0.07, dur: 0.9, gain: 0.06, bell: true }))
  },
  day() {
    ;[[261.63, 0], [329.63, 0.05], [392.0, 0.1], [523.25, 0.18], [659.25, 0.3], [783.99, 0.45]].forEach(([f, at]) =>
      tone(f, { at, dur: 2.2, gain: 0.05, bell: true }),
    )
  },
  grow(step: number) {
    tone(SCALE[step % SCALE.length] / 2, { dur: 0.6, gain: 0.03, bell: true })
  },
}

export const haptic = {
  tap() {
    vibrate(5)
  },
  correct() {
    vibrate(9)
  },
  wrong() {
    vibrate([14, 50, 14])
  },
  success() {
    vibrate([10, 40, 10, 40, 22])
  },
}

function vibrate(p: number | number[]) {
  if (!hapticsOn) return
  try {
    navigator.vibrate?.(p)
  } catch {
    /* unsupported */
  }
}
