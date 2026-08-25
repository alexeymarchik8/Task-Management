import { test, expect } from '@playwright/test';
import { registerUser, createProject, uniqueEmail } from './helpers';

test.describe('Home analytics', () => {
  test('a new task is reflected in the summary and per-project breakdown', async ({ page }) => {
    await registerUser(page, uniqueEmail('analytics'));
    await createProject(page, 'Analytics Project');
    await page.getByRole('link', { name: 'Analytics Project' }).click();

    await page.getByRole('button', { name: '+ Новая задача' }).click();
    await page.getByLabel('Заголовок').fill('Analytics task');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText('Analytics task')).toBeVisible();

    await page.goto('/homepage');

    const totalCard = page.locator('[class*="summaryCard"]', { hasText: 'Всего задач' });
    await expect(totalCard.getByText('1', { exact: true })).toBeVisible();
    await expect(page.locator('main').getByText('Analytics Project')).toBeVisible();
    await expect(page.locator('main').getByText('1 задач · 0%')).toBeVisible();
  });

  test('clicking a project in the summary navigates to its dashboard', async ({ page }) => {
    await registerUser(page, uniqueEmail('analytics-nav'));
    await createProject(page, 'Nav Project');
    await page.getByRole('link', { name: 'Nav Project' }).click();
    const dashboardUrl = page.url();

    await page.goto('/homepage');
    await page.getByRole('button', { name: 'Nav Project' }).click();

    await expect(page).toHaveURL(dashboardUrl);
  });

  test('a user with no projects sees the empty state, not an error', async ({ page }) => {
    await registerUser(page, uniqueEmail('analytics-empty'));

    await expect(page.getByText('У вас пока нет проектов с задачами.')).toBeVisible();
    const totalCard = page.locator('[class*="summaryCard"]', { hasText: 'Всего задач' });
    await expect(totalCard.getByText('0', { exact: true })).toBeVisible();
  });
});
