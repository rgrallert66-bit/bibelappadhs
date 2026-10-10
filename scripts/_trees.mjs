import { chromium } from 'playwright'
import { demoState } from './demo-state.mjs'
const out = process.argv[2]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.goto('http://127.0.0.1:5173/')
for (const d of [1, 3, 8, 20, 45, 120, 400]) {
  const st = JSON.parse(demoState({ days: d }))
  if (d < 8) { const keep = Object.keys(st.state.memory.elb).slice(0, d); st.state.memory.elb = Object.fromEntries(keep.map(k => [k, st.state.memory.elb[k]])) }
  await page.evaluate((s) => localStorage.setItem('scripture-v1', s), JSON.stringify(st))
  await page.reload()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${out}/t-${d}.png`, clip: { x: 0, y: 0, width: 390, height: 470 } })
}
await browser.close()
