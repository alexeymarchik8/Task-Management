import { test, expect, type Browser } from '@playwright/test';
import { registerUser, createProject, uniqueEmail } from './helpers';

async function newUserPage(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { context, page };
}

test.describe('Sidebar people and join requests', () => {
  test('the project owner sees "Владелец" in both the People list and the Info panel', async ({
    page,
  }) => {
    await registerUser(page, uniqueEmail('owner-role'));
    await createProject(page, 'Role Project');
    await page.getByRole('link', { name: 'Role Project' }).click();

    await expect(page.getByText('Владелец')).toBeVisible();

    await page.getByRole('button', { name: 'Информация' }).click();
    await expect(page.getByText('Роль: Владелец')).toBeVisible();
  });

  test('a second user can join by code, and the owner approves the request', async ({
    browser,
  }) => {
    const { context: ownerContext, page: ownerPage } = await newUserPage(browser);
    const { context: memberContext, page: memberPage } = await newUserPage(browser);

    try {
      await registerUser(ownerPage, uniqueEmail('join-owner'));
      await createProject(ownerPage, 'Join Project');
      await ownerPage.getByRole('link', { name: 'Join Project' }).click();

      await ownerPage.getByRole('button', { name: 'Информация' }).click();
      const codeRow = ownerPage.locator('p', { hasText: 'Код:' });
      await expect(codeRow).toBeVisible();
      const codeText = await codeRow.innerText();
      const code = codeText.replace('Код:', '').trim();
      expect(code).toMatch(/^[A-Za-z0-9]{8}$/);

      await registerUser(memberPage, uniqueEmail('join-member'));
      await memberPage.getByLabel('Код проекта').fill(code);
      await memberPage.getByRole('button', { name: 'Вступить' }).click();
      await expect(memberPage.getByText('Заявка отправлена')).toBeVisible();

      await ownerPage.reload();
      await ownerPage.getByRole('link', { name: 'Join Project' }).click();
      await expect(ownerPage.getByText('Заявки на вступление')).toBeVisible();
      await ownerPage.getByRole('button', { name: 'Принять' }).click();

      await expect(ownerPage.getByText('Заявки на вступление')).not.toBeVisible();
      await expect(ownerPage.getByText('Участник')).toBeVisible();
    } finally {
      await ownerContext.close();
      await memberContext.close();
    }
  });
});
