import { test, expect } from '@playwright/test';

test('user can edit a trip', async ({ page }) => {
  await page.goto('/dashboard');

  await page.getByTitle('Edit').first().click();

  await page.fill('#travelers', '99');

  await page.getByRole('button', { name: /confirm/i }).click();

  await expect(page.getByText('99')).toBeVisible();
});