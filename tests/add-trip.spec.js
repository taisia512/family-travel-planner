import { test, expect } from '@playwright/test';

test('user can add a new trip', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /start planning/i }).click();
  await page.getByRole('button', { name: /\+ add trip/i }).click();

  await page.selectOption('#country', 'Austria');
  await page.selectOption('#city', 'Vienna');
  await page.fill('#startDate', '2026-01-01');
  await page.fill('#endDate', '2026-01-05');
  await page.fill('#travelers', '987');

  await page.getByRole('button', { name: /confirm/i }).click();

  await expect(page.getByText('Vienna')).toBeVisible();
  await expect(page.getByText('987')).toBeVisible();
});