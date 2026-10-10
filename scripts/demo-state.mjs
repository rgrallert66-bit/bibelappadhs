// Builds a realistic "6 weeks in" state for screenshots & reviews.
export function demoState({ days = 45, translation = 'elb', theme = 'auto' } = {}) {
  const today = new Date()
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const ago = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return key(d) }
  const learnDays = []
  for (let i = 1; learnDays.length < days; i++) if (i % 9 !== 4) learnDays.unshift(ago(i))
  const ids = ['ps119-11', 'ps119-105', 'john1-1', 'gen1-1', 'ps1-3', 'jas1-22', 'heb13-8', 'john3-16', 'rom3-23', 'rom6-23', 'rom5-8', 'eph2-8', 'jos1-9', 'isa41-10', 'phil4-13', 'ps23-1']
  const stab = [95, 70, 40, 33, 22, 18, 12, 9, 6, 4.5, 3, 2.2, 1.4, 1.1, 0.8, 0.5]
  const mem = {}
  ids.forEach((id, i) => {
    const last = ago(Math.max(1, Math.round(stab[i] * 0.6)))
    const due = i % 4 === 0 ? ago(0) : (() => { const d = new Date(today); d.setDate(d.getDate() + Math.round(stab[i] * 0.4) + 1); return key(d) })()
    mem[id] = { stability: stab[i], difficulty: 5, last, due, reps: 3 + (16 - i), lapses: i % 5 === 0 ? 1 : 0 }
  })
  const golden = learnDays.filter((_, i) => i % 6 === 2)
  const state = {
    onboarded: true, name: '', translation, goal: 'normal', newPerDay: 1, sound: false, haptics: true, theme,
    memory: { elb: translation === 'elb' ? mem : {}, nkjv: translation === 'nkjv' ? mem : {} },
    queue: ['rom10-9', '1john1-9', '2cor5-17', 'john14-6', 'john11-25', '2tim1-7', 'isa40-31', 'ps46-2', 'prov3-5', 'phil4-6', '1pet5-7', 'matt11-28', 'ps37-5', 'jer29-11', 'rom8-28', 'rom12-2', 'matt6-33', 'matt5-14', 'john15-5', 'gal5-22', 'mic6-8', '1cor13-13', 'john13-34', '1thess5-16', 'ps139-14', 'heb11-1', 'john8-32'],
    custom: [], learnDays, goldenDays: golden, planted: {}, log: Object.fromEntries(learnDays.map((d) => [d, { cards: 12, errors: 1, items: 60, ms: 300000 }])),
    questDay: '', questStats: { cards: 0, perfectCards: 0, perfectOrder: 0, letters: 0, maxCombo: 0, byHeart: 0, planted: 0, errors: 0, items: 0, ms: 0 }, questDaily: 0,
    bias: 0.1, bestCombo: 41, totalCards: 520,
    achievements: { 'first-seed': ago(days), 'days-3': ago(days - 3), 'days-7': ago(days - 7), 'days-30': ago(10), 'streak-7': ago(30), 'verses-5': ago(30), 'verses-15': ago(3), blossom: ago(12), fruit: ago(2), golden: ago(20), 'combo-25': ago(15) },
    treeSeen: learnDays.length, highlight: null,
  }
  return JSON.stringify({ state, version: 1 })
}
