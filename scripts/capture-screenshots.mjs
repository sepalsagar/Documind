import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const outputDir = 'screenshots';
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await desktop.newPage();
const shot = (name, target = page) => target.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
const visit = (target, url) => target.goto(url, { waitUntil: 'domcontentloaded' }).catch((error) => {
  if (!String(error).includes('ERR_ABORTED')) throw error;
});

await visit(page, `${baseUrl}/`);
await page.waitForTimeout(500);
await shot('landing');
await visit(page, `${baseUrl}/login`);
await page.waitForTimeout(500);
await shot('login');
await visit(page, `${baseUrl}/`);
await page.waitForTimeout(500);
await page.locator('button').filter({ hasText: 'Try the demo' }).click();
await page.waitForURL(/\/app/);
await page.waitForLoadState('networkidle');
await shot('app-sample-document');

const documentCard = page.getByText(/Northstar Labs Leave/i).first();
if (await documentCard.count()) {
  await documentCard.click();
  await page.waitForTimeout(500);
  await shot('chat-citations');
  const starter = page.getByText(/What is the core objective|leave policy|key findings/i).first();
  if (await starter.count()) {
    await starter.click();
    await page.waitForTimeout(1500);
    await shot('sources-citation-view');
  }
}

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const mobilePage = await mobile.newPage();
await visit(mobilePage, `${baseUrl}/`);
await mobilePage.waitForTimeout(500);
await mobilePage.evaluate(() => fetch('/api/auth/demo', { method: 'POST' }));
await visit(mobilePage, `${baseUrl}/app`);
await mobilePage.waitForLoadState('networkidle');
const mobileDocument = mobilePage.getByText(/Northstar Labs Leave/i).first();
if (await mobileDocument.count()) {
  await mobileDocument.click();
  await mobilePage.waitForTimeout(500);
}
await shot('mobile-chat', mobilePage);

await mobile.close();
await desktop.close();
await browser.close();
console.log(`Screenshots saved to ${outputDir}/`);
