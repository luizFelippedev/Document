import { test, expect } from '@playwright/test';
test('user can log in', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('input[type=email]', 'test@example.com');
  await page.fill('input[type=password]', 'password123');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Welcome back')).toBeVisible();
});
