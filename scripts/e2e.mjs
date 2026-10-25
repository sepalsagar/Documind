import { chromium } from 'playwright';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const email = `e2e-${randomUUID()}@example.test`;
const password = 'E2E-password-123!';
const fixture = resolve('scripts/demo-policy.pdf');

try {
  await page.goto(`${baseUrl}/`);
  await page.getByText('Try the demo', { exact: true }).first().waitFor();

  await page.goto(`${baseUrl}/register`);
  await page.locator('#register_name').fill('E2E Tester');
  await page.locator('#register_email').fill(email);
  await page.locator('#register_password').fill(password);
  await page.locator('#register_confirm_password').fill(password);
  await page.locator('#register_submit_btn').click();
  await page.waitForURL(/\/app/);

  await page.locator('#header_upload_cta_btn').click();
  await page.locator('#pdf_file_input').setInputFiles(fixture);
  await page.locator('#submit_upload_btn').click();
  await page.locator('#upload_modal_container').waitFor({ state: 'hidden', timeout: 120000 });

  await page.locator('#workspace_chat_input').waitFor({ timeout: 120000 });
  await page.locator('#workspace_chat_input').fill('How many leave days accrue each month?');
  await page.locator('#workspace_send_btn').click();
  await page.getByText(/Page 2/).first().waitFor({ timeout: 120000 });

  await page.locator('#sidebar_logout_btn').click();
  await page.locator('#login_submit_btn').waitFor();
  await page.locator('#login_email').fill(email);
  await page.locator('#login_password').fill(password);
  await page.locator('#login_submit_btn').click();
  await page.locator('#workspace_chat_input').waitFor({ timeout: 120000 });
  await page.getByText('How many leave days accrue each month?', { exact: true }).waitFor();

  await page.goto(`${baseUrl}/login`);
  await page.getByText('Try the demo without signing up', { exact: true }).click();
  await page.waitForURL(/\/app/);
  console.log('E2E passed: landing, registration, upload, cited answer, logout/login history, and demo flow.');
} finally {
  await browser.close();
}
