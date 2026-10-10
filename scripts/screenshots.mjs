// Usage: node scripts/screenshots.mjs [baseUrl] [outDir]
// Plays through the real app in Chromium (iPhone-sized) and captures screenshots.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { demoState } from './demo-state.mjs'
import { solveCard, next } from './play.mjs'

const base = process.argv[2] ?? 'http://127.0.0.1:5173/'
const out = process.argv[3] ?? 'screenshots'
mkdirSync(out, { recursive: true })
const errors = []
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})

async function newPage(scheme = 'light') {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme, hasTouch: true, isMobile: true })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console] ${m.text()}`) })
  return page
}
const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png` })

// ── A: first launch ───────────────────────────────────────────────
{
  const page = await newPage('light')
  await page.goto(base)
  await page.waitForTimeout(3800)
  await shot(page, '01-welcome')
  await page.getByRole('button', { name: /Los geht/ }).click()
  await page.waitForTimeout(600)
  await shot(page, '02-translation')
  await page.getByRole('button', { name: 'Weiter' }).click()
  await page.waitForTimeout(600)
  await shot(page, '03-rhythm')
  await page.getByRole('button', { name: 'Weiter' }).click()
  await page.waitForTimeout(600)
  await shot(page, '04-path')
  await page.getByRole('button', { name: /Ersten Vers pflanzen/ }).click()
  await page.waitForTimeout(900)
  let n = 0
  while (n < 40) {
    const info = await page.evaluate(() => window.__scriptureCard)
    if (!info?.card) break
    const tag = `${String(n + 1).padStart(2, '0')}-${info.card.kind}`
    if (info.card.kind === 'intro') {
      await page.locator('.ex-intro').click(); await page.waitForTimeout(500)
      await shot(page, `10-first-${tag}-a`)
    } else {
      await shot(page, `10-first-${tag}-a`)
    }
    await solveCard(page, { mistakes: n === 2 ? 1 : 0 })
    await shot(page, `10-first-${tag}-b`)
    n++
    const last = info.index + 1 >= info.total
    await next(page)
    if (last) break
  }
  await page.waitForTimeout(2200)
  await shot(page, '20-summary')
  await page.locator('.summary-foot .btn').click()
  await page.waitForTimeout(2200)
  await shot(page, '21-home-growing')
  await page.waitForTimeout(3500)
  await shot(page, '22-home-day1')
  await page.locator('.screen').evaluate((el) => el.scrollTo(0, 600))
  await page.waitForTimeout(500)
  await shot(page, '23-home-day1-scrolled')
  await page.context().close()
}

// ── B: six weeks in (light) ───────────────────────────────────────
for (const [scheme, suffix, translation] of [['light', 'light', 'elb'], ['dark', 'dark', 'elb'], ['light', 'en', 'nkjv']]) {
  const page = await newPage(scheme)
  await page.goto(base)
  await page.evaluate((s) => localStorage.setItem('scripture-v1', s), demoState({ translation }))
  await page.reload()
  await page.waitForTimeout(1500)
  await shot(page, `30-${suffix}-home`)
  if (suffix !== 'light') {
    await page.locator('.cta .btn').click()
    await page.waitForTimeout(900)
    for (let i = 0; i < 3; i++) {
      const info = await page.evaluate(() => window.__scriptureCard)
      await shot(page, `31-${suffix}-card${i + 1}-${info.card.kind}`)
      await solveCard(page)
      if (i === 0) await shot(page, `31-${suffix}-card${i + 1}-${info.card.kind}-solved`)
      await next(page)
    }
    await page.context().close()
    continue
  }
  await page.locator('.screen').evaluate((el) => el.scrollTo(0, 700))
  await page.waitForTimeout(400)
  await shot(page, '30-light-home-scrolled')
  // library
  await page.locator('.tabbar .tab').nth(1).click()
  await page.waitForTimeout(900)
  await shot(page, '40-library')
  await page.locator('.vrow').first().click()
  await page.waitForTimeout(800)
  await shot(page, '41-verse-sheet')
  await page.mouse.click(195, 60)
  await page.waitForTimeout(600)
  // profile
  await page.locator('.tabbar .tab').nth(2).click()
  await page.waitForTimeout(900)
  await shot(page, '50-profile')
  await page.locator('.screen').evaluate((el) => el.scrollTo(0, 650))
  await page.waitForTimeout(400)
  await shot(page, '51-profile-2')
  await page.locator('.screen').evaluate((el) => el.scrollTo(0, 1400))
  await page.waitForTimeout(400)
  await shot(page, '52-profile-3')
  // review session with a full run
  await page.locator('.tabbar .tab').nth(0).click()
  await page.waitForTimeout(800)
  await page.locator('.cta .btn').click()
  await page.waitForTimeout(900)
  let n = 0
  while (n < 40) {
    const info = await page.evaluate(() => window.__scriptureCard)
    if (!info?.card) break
    await shot(page, `60-review-${String(n + 1).padStart(2, '0')}-${info.card.kind}${info.card.kind === 'letters' ? info.card.hint : ''}`)
    await solveCard(page)
    if (['letters', 'spot', 'chain'].includes(info.card.kind)) await shot(page, `60-review-${String(n + 1).padStart(2, '0')}-${info.card.kind}-solved`)
    n++
    const last = info.index + 1 >= info.total
    await next(page)
    if (last) break
  }
  await page.waitForTimeout(2200)
  await shot(page, '61-review-summary')
  await page.locator('.summary-foot .btn').click()
  await page.waitForTimeout(1800)
  await shot(page, '62-home-growing')
  await page.waitForTimeout(3600)
  await shot(page, '63-home-after')
  await page.context().close()
}

await browser.close()
console.log(errors.length ? errors.join('\n') : 'No console errors.')
