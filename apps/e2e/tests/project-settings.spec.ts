import { test, expect, type Browser } from '@playwright/test';
import { registerUser, createProject, uniqueEmail } from './helpers';

async function newUserPage(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { context, page };
}

test.describe('Project settings', () => {
  test('the owner can rename the project', async ({ page }) => {
    await registerUser(page, uniqueEmail('settings-rename'));
    await createProject(page, 'Old Name');
    await page.getByRole('link', { name: 'Old Name' }).click();

    await page.getByRole('button', { name: 'Настройки' }).click();
    await page.getByLabel('Новое название проекта').fill('New Name');
    await page.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByRole('link', { name: 'New Name' })).toBeVisible();
  });

  test('the owner can remove a member from the project', async ({ browser }) => {
    const { context: ownerContext, page: ownerPage } = await newUserPage(browser);
    const { context: memberContext, page: memberPage } = await newUserPage(browser);

    try {
      await registerUser(ownerPage, uniqueEmail('settings-remove-owner'));
      await createProject(ownerPage, 'Remove Member Project');
      await ownerPage.getByRole('link', { name: 'Remove Member Project' }).click();

      await ownerPage.getByRole('button', { name: 'Информация' }).click();
      const codeRow = ownerPage.locator('p', { hasText: 'Код:' });
      const code = (await codeRow.innerText()).replace('Код:', '').trim();

      const memberEmail = uniqueEmail('settings-remove-member');
      await registerUser(memberPage, memberEmail);
      await memberPage.getByLabel('Код проекта').fill(code);
      await memberPage.getByRole('button', { name: 'Вступить' }).click();

      await ownerPage.reload();
      await ownerPage.getByRole('link', { name: 'Remove Member Project' }).click();
      await ownerPage.getByRole('button', { name: 'Принять' }).click();
      await expect(ownerPage.getByText(memberEmail)).toBeVisible();

      await ownerPage.getByRole('button', { name: 'Настройки' }).click();
      await ownerPage.getByRole('button', { name: `Удалить участника ${memberEmail}` }).click();
      await ownerPage.getByRole('button', { name: 'Удалить', exact: true }).click();
      await ownerPage.getByRole('button', { name: 'Настройки' }).click();

      await expect(ownerPage.getByText(memberEmail)).not.toBeVisible();
    } finally {
      await ownerContext.close();
      await memberContext.close();
    }
  });

  test('the owner can delete the project, and it disappears from the sidebar', async ({ page }) => {
    await registerUser(page, uniqueEmail('settings-delete'));
    await createProject(page, 'Doomed Project');
    await page.getByRole('link', { name: 'Doomed Project' }).click();

    await page.getByRole('button', { name: 'Настройки' }).click();
    await page.getByRole('button', { name: 'Удалить проект' }).click();
    await page.getByRole('button', { name: 'Удалить', exact: true }).click();

    await expect(page).toHaveURL(/\/homepage$/);
    await expect(page.getByRole('link', { name: 'Doomed Project' })).not.toBeVisible();
  });

  test('a member can leave the project, and it disappears from their sidebar', async ({
    browser,
  }) => {
    const { context: ownerContext, page: ownerPage } = await newUserPage(browser);
    const { context: memberContext, page: memberPage } = await newUserPage(browser);

    try {
      await registerUser(ownerPage, uniqueEmail('settings-leave-owner'));
      await createProject(ownerPage, 'Leave Project');
      await ownerPage.getByRole('link', { name: 'Leave Project' }).click();

      await ownerPage.getByRole('button', { name: 'Информация' }).click();
      const codeRow = ownerPage.locator('p', { hasText: 'Код:' });
      const code = (await codeRow.innerText()).replace('Код:', '').trim();

      await registerUser(memberPage, uniqueEmail('settings-leave-member'));
      await memberPage.getByLabel('Код проекта').fill(code);
      await memberPage.getByRole('button', { name: 'Вступить' }).click();

      await ownerPage.reload();
      await ownerPage.getByRole('link', { name: 'Leave Project' }).click();
      await ownerPage.getByRole('button', { name: 'Принять' }).click();

      await memberPage.reload();
      await memberPage.getByRole('link', { name: 'Leave Project' }).click();
      await memberPage.getByRole('button', { name: 'Настройки' }).click();
      await memberPage.getByRole('button', { name: 'Выйти из проекта' }).click();
      await memberPage.getByRole('button', { name: 'Выйти', exact: true }).click();

      await expect(memberPage).toHaveURL(/\/homepage$/);
      await expect(memberPage.getByRole('link', { name: 'Leave Project' })).not.toBeVisible();
    } finally {
      await ownerContext.close();
      await memberContext.close();
    }
  });
});
