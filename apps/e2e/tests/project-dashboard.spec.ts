import { test, expect } from '@playwright/test';
import { registerUser, createProject, uniqueEmail } from './helpers';

test.describe('Project dashboard', () => {
  test('creating a project and a task shows the task in the Backlog column', async ({ page }) => {
    await registerUser(page, uniqueEmail('dashboard'));
    await createProject(page, 'E2E Project');

    await page.getByRole('link', { name: 'E2E Project' }).click();
    await expect(page).toHaveURL(/\/dashboard\/.+/);

    await page.getByRole('button', { name: '+ Новая задача' }).click();
    await page.getByLabel('Заголовок').fill('Написать E2E тесты');
    await page.getByRole('button', { name: 'Сохранить' }).click();

    const backlogColumn = page.getByRole('region', { name: 'Backlog' });
    await expect(backlogColumn.getByText('1', { exact: true })).toBeVisible();
    await expect(backlogColumn.getByText('Написать E2E тесты')).toBeVisible();
  });

  test('changing a task status moves it between columns', async ({ page }) => {
    await registerUser(page, uniqueEmail('dashboard-status'));
    await createProject(page, 'Status Project');
    await page.getByRole('link', { name: 'Status Project' }).click();

    await page.getByRole('button', { name: '+ Новая задача' }).click();
    await page.getByLabel('Заголовок').fill('Task to move');
    await page.getByRole('button', { name: 'Сохранить' }).click();

    const card = page.locator('article', { hasText: 'Task to move' });
    await card.getByRole('combobox').selectOption('done');

    await expect(card.getByRole('combobox')).toHaveValue('done');
  });

  test('deleting a task removes its card from the board', async ({ page }) => {
    await registerUser(page, uniqueEmail('dashboard-delete'));
    await createProject(page, 'Delete Project');
    await page.getByRole('link', { name: 'Delete Project' }).click();

    await page.getByRole('button', { name: '+ Новая задача' }).click();
    await page.getByLabel('Заголовок').fill('Task to delete');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText('Task to delete')).toBeVisible();

    const card = page.locator('article', { hasText: 'Task to delete' });
    await card.getByRole('button', { name: 'Удалить задачу' }).click();

    await expect(page.getByText('Task to delete')).not.toBeVisible();
  });
});
