import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'
import AxeBuilder from '@axe-core/playwright'

const baseURL = process.env.PREVIEW_URL || 'http://127.0.0.1:5173'
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true })

async function checkAccessibility(page, label) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const blocking = result.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))
  const detail = blocking.map((item) => `${item.id}: ${item.nodes.map((node) => node.target.join(' ')).join(' | ')}`).join('; ')
  assert.equal(blocking.length, 0, `${label} có lỗi accessibility: ${detail}`)
}

try {
  await mkdir('.preview', { recursive: true })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  const page = await context.newPage()
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  assert.equal(await page.locator('.product-card').count(), 14, 'Menu phải hiển thị đủ 14 món đã xác minh')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  assert.ok(overflow <= 1, `Trang chủ tràn ngang ${overflow}px`)
  await checkAccessibility(page, 'Trang chủ')
  await page.screenshot({ path: '.preview/home-mobile-device.png', fullPage: false })

  await page.locator('.product-card button').first().click()
  await page.locator('.product-modal .add-button').click()
  await page.getByRole('button', { name: 'Tiếp tục đặt hàng' }).click()
  await page.getByLabel('Họ và tên *').fill('Khách kiểm thử')
  await page.getByLabel('Số điện thoại *').fill('0912345678')
  await page.getByLabel('Địa chỉ nhận hàng *').fill('123 Đường kiểm thử')
  await page.getByRole('button', { name: /Đặt hàng/ }).click()
  await page.getByText('Cảm ơn bạn đã ghé Cái Tiệm KàFe!').waitFor()

  await page.goto(`${baseURL}/vibe`, { waitUntil: 'networkidle' })
  assert.ok((await page.locator('blockquote').textContent())?.trim(), 'Trang Vibe phải có nội dung')
  const vibeOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  assert.ok(vibeOverflow <= 1, `Trang Vibe tràn ngang ${vibeOverflow}px`)
  await checkAccessibility(page, 'Trang Vibe')
  await page.screenshot({ path: '.preview/vibe-mobile-device.png', fullPage: false })
  await context.close()

  const adminContext = await browser.newContext({ viewport: { width: 1366, height: 900 } })
  const admin = await adminContext.newPage()
  await admin.goto(`${baseURL}/admin/login`, { waitUntil: 'networkidle' })
  await admin.getByLabel('Tên đăng nhập').fill('admin')
  await admin.getByLabel('Mật khẩu').fill('password-for-visual-test')
  await admin.getByRole('button', { name: 'Đăng nhập' }).click()
  await admin.getByText('Tổng quan quán').waitFor()
  await checkAccessibility(admin, 'Admin dashboard')
  await admin.screenshot({ path: '.preview/admin-desktop.png', fullPage: false })
  await adminContext.close()

  const tabletContext = await browser.newContext({ viewport: { width: 768, height: 1024 } })
  const tablet = await tabletContext.newPage()
  await tablet.goto(baseURL, { waitUntil: 'networkidle' })
  const tabletOverflow = await tablet.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  assert.ok(tabletOverflow <= 1, `Trang tablet tràn ngang ${tabletOverflow}px`)
  await tabletContext.close()
  console.log('Visual smoke test passed: menu, cart, checkout, Vibe, admin, accessibility, responsive overflow')
} finally {
  await browser.close()
}
