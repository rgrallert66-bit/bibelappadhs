// Plays through sessions by reading the current card from the test hook.
export async function solveCard(page, { mistakes = 0 } = {}) {
  const info = await page.evaluate(() => window.__scriptureCard)
  if (!info || !info.card) return false
  const c = info.card
  const clickText = async (sel, text) => {
    const loc = page.locator(sel, { hasText: text }).filter({ hasNotText: '___' })
    const n = await loc.count()
    for (let i = 0; i < n; i++) {
      const t = (await loc.nth(i).innerText()).trim()
      if (t === text.trim()) { await loc.nth(i).click(); return }
    }
    await loc.first().click()
  }
  switch (c.kind) {
    case 'intro':
      for (let i = 0; i < c.chunks.length; i++) { await page.locator('.ex-intro').click(); await page.waitForTimeout(120) }
      break
    case 'order':
      for (let i = 0; i < c.chunks.length; i++) { await clickText('.order-pool .tile', c.chunks[i]); await page.waitForTimeout(160) }
      break
    case 'cloze':
      for (let g = 0; g < c.gaps.length; g++) {
        if (mistakes > 0 && g === 0) {
          const wrong = c.options[g].find((o) => o !== c.tokens[c.gaps[g]].word)
          await clickText('.options .opt', wrong); await page.waitForTimeout(250)
        }
        await clickText('.options .opt', c.tokens[c.gaps[g]].word); await page.waitForTimeout(200)
      }
      break
    case 'chain':
      for (let p = c.given; p < c.tokens.length; p++) { await clickText('.options .opt', c.tokens[p].word); await page.waitForTimeout(140) }
      break
    case 'spot':
      await clickText('.spot-word', c.wrongWord); await page.waitForTimeout(900)
      break
    case 'letters':
      for (let i = 0; i < c.tokens.length; i++) {
        if (mistakes > 0 && i === 2) { await page.keyboard.press('q'); await page.waitForTimeout(100) }
        await page.keyboard.press(c.tokens[i].first); await page.waitForTimeout(70)
      }
      break
    case 'reference': {
      const ref = await page.locator('.ex-kicker').first().innerText()
      // the correct option is the verse of the card
      const correct = await page.evaluate((id) => id, c.verseId)
      const opts = page.locator('.options .opt')
      const n = await opts.count()
      for (let i = 0; i < n; i++) {
        await opts.nth(i).click(); await page.waitForTimeout(200)
        const solved = await page.evaluate(() => window.__scriptureCard.solved)
        if (solved) break
      }
      void ref; void correct
      break
    }
  }
  await page.waitForTimeout(700)
  return true
}

export async function next(page) {
  await page.locator('.feedback .btn').click()
  await page.waitForTimeout(450)
}
