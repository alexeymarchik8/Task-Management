import { test, expect } from '@playwright/test';
import { registerUser, uniqueEmail } from './helpers';

test.describe('Auth', () => {
  test('registering a new user redirects to the home page with an empty state', async ({
    page,
  }) => {
    await registerUser(page, uniqueEmail('auth'));

    await expect(page).toHaveURL(/\/homepage$/);
    await expect(page.getByRole('heading', { name: 'Обзор' })).toBeVisible();
    await expect(page.getByText('У вас пока нет проектов с задачами.')).toBeVisible();
  });

  test('an unauthenticated user visiting /homepage is redirected to /login', async ({ page }) => {
    await page.goto('/homepage');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('an unauthenticated user visiting a dashboard is redirected to /login', async ({ page }) => {
    await page.goto('/dashboard/00000000-0000-0000-0000-000000000000');

    await expect(page).toHaveURL(/\/login$/);
  });
});
