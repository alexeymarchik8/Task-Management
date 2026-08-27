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

  test('filtering by status and searching by title narrows the board', async ({ page }) => {
    await registerUser(page, uniqueEmail('dashboard-filter'));
    await createProject(page, 'Filter Project');
    await page.getByRole('link', { name: 'Filter Project' }).click();

    await page.getByRole('button', { name: '+ Новая задача' }).click();
    await page.getByLabel('Заголовок').fill('Write the report');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText('Write the report')).toBeVisible();

    await page.getByRole('button', { name: '+ Новая задача' }).click();
    await page.getByLabel('Заголовок').fill('Plan the sprint');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText('Plan the sprint')).toBeVisible();

    const reportCard = page.locator('article', { hasText: 'Write the report' });
    await reportCard.getByRole('combobox').selectOption('done');

    await page.getByLabel('Фильтр по статусу').selectOption('done');
    await expect(page.getByText('Write the report')).toBeVisible();
    await expect(page.getByText('Plan the sprint')).not.toBeVisible();

    await page.getByLabel('Фильтр по статусу').selectOption('');
    await expect(page.getByText('Plan the sprint')).toBeVisible();

    await page.getByLabel('Поиск задач').fill('sprint');
    await expect(page.getByText('Plan the sprint')).toBeVisible();
    await expect(page.getByText('Write the report')).not.toBeVisible();
    await expect(page).toHaveURL(/search=sprint/);

    await page.reload();
    await expect(page.getByText('Plan the sprint')).toBeVisible();
    await expect(page.getByText('Write the report')).not.toBeVisible();
  });

  test('dragging a task card to another column moves it there', async ({ page }) => {
    await registerUser(page, uniqueEmail('dashboard-dnd'));
    await createProject(page, 'DnD Project');
    await page.getByRole('link', { name: 'DnD Project' }).click();

    await page.getByRole('button', { name: '+ Новая задача' }).click();
    await page.getByLabel('Заголовок').fill('Drag me');
    await page.getByRole('button', { name: 'Сохранить' }).click();

    const card = page.locator('article', { hasText: 'Drag me' });
    await expect(card).toBeVisible();
    const handle = card.getByRole('button', { name: 'Перетащить задачу' });
    const targetColumn = page.getByRole('region', { name: 'In Progress' });

    const handleBox = await handle.boundingBox();
    const targetBox = await targetColumn.boundingBox();
    if (!handleBox || !targetBox) {
      throw new Error('Could not measure drag handle or target column');
    }

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, handleBox.y, { steps: 10 });
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 40, { steps: 10 });
    await page.mouse.up();

    const inProgressColumn = page.getByRole('region', { name: 'In Progress' });
    await expect(inProgressColumn.getByText('Drag me')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Backlog' })).not.toHaveText(/Drag me/);

    await page.reload();

    await expect(
      page.getByRole('region', { name: 'In Progress' }).getByText('Drag me'),
    ).toBeVisible();
    await expect(page.getByRole('region', { name: 'Backlog' })).not.toHaveText(/Drag me/);
  });

  test('editing a task updates its title, description, priority and due date', async ({ page }) => {
    await registerUser(page, uniqueEmail('dashboard-edit'));
    await createProject(page, 'Edit Project');
    await page.getByRole('link', { name: 'Edit Project' }).click();

    await page.getByRole('button', { name: '+ Новая задача' }).click();
    await page.getByLabel('Заголовок').fill('Original title');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText('Original title')).toBeVisible();

    const card = page.locator('article', { hasText: 'Original title' });
    await card.getByRole('button', { name: 'Изменить' }).click();

    await page.getByLabel('Заголовок').fill('Updated title');
    await page.getByLabel('Описание').fill('Updated description');
    await page.getByLabel('Приоритет', { exact: true }).selectOption('high');
    await page.getByLabel('Срок').fill('2026-12-31');
    await page.getByRole('button', { name: 'Сохранить' }).click();

    const expectedDueDate = await page.evaluate(() => new Date('2026-12-31').toLocaleDateString());
    const updatedCard = page.locator('article', { hasText: 'Updated title' });
    await expect(updatedCard).toBeVisible();
    await expect(updatedCard.getByText('Updated description')).toBeVisible();
    await expect(updatedCard.getByText('High')).toBeVisible();
    await expect(updatedCard.getByText(expectedDueDate)).toBeVisible();
  });

  test('assigning a task to a project member shows their email on the card', async ({ page }) => {
    const email = uniqueEmail('dashboard-assignee');
    await registerUser(page, email);
    await createProject(page, 'Assignee Project');
    await page.getByRole('link', { name: 'Assignee Project' }).click();

    await page.getByRole('button', { name: '+ Новая задача' }).click();
    await page.getByLabel('Заголовок').fill('Task to assign');
    await page.getByLabel('Исполнитель').selectOption({ label: email });
    await page.getByRole('button', { name: 'Сохранить' }).click();

    const card = page.locator('article', { hasText: 'Task to assign' });
    await expect(card.getByText(email)).toBeVisible();
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
