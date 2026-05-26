import { test, expect } from '@playwright/test';

test('user can delete a trip', async ({ page }) => {
  await page.goto('/dashboard');

  const firstTrip = page.locator('.trip-card').first();
  await expect(firstTrip).toBeVisible();

  await page.getByTitle('Delete').first().click();
  await page.getByRole('button', { name: /confirm/i }).click();

  await expect(page.getByText(/delete trip/i)).not.toBeVisible();
});