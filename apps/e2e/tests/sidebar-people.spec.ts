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

  test('the owner can reject a join request, and it disappears from the pending list', async ({
    browser,
  }) => {
    const { context: ownerContext, page: ownerPage } = await newUserPage(browser);
    const { context: applicantContext, page: applicantPage } = await newUserPage(browser);

    try {
      await registerUser(ownerPage, uniqueEmail('reject-owner'));
      await createProject(ownerPage, 'Reject Project');
      await ownerPage.getByRole('link', { name: 'Reject Project' }).click();

      await ownerPage.getByRole('button', { name: 'Информация' }).click();
      const codeRow = ownerPage.locator('p', { hasText: 'Код:' });
      const codeText = await codeRow.innerText();
      const code = codeText.replace('Код:', '').trim();

      await registerUser(applicantPage, uniqueEmail('reject-applicant'));
      await applicantPage.getByLabel('Код проекта').fill(code);
      await applicantPage.getByRole('button', { name: 'Вступить' }).click();
      await expect(applicantPage.getByText('Заявка отправлена')).toBeVisible();

      await ownerPage.reload();
      await ownerPage.getByRole('link', { name: 'Reject Project' }).click();
      await expect(ownerPage.getByText('Заявки на вступление')).toBeVisible();
      await ownerPage.getByRole('button', { name: 'Отклонить' }).click();

      await expect(ownerPage.getByText('Заявки на вступление')).not.toBeVisible();

      await applicantPage.reload();
      await expect(applicantPage.getByText('Отклонена')).toBeVisible();
    } finally {
      await ownerContext.close();
      await applicantContext.close();
    }
  });

  test('a member sees "Участник" in the Info panel and no pending-requests section for a project they do not own', async ({
    browser,
  }) => {
    const { context: ownerContext, page: ownerPage } = await newUserPage(browser);
    const { context: memberContext, page: memberPage } = await newUserPage(browser);

    try {
      await registerUser(ownerPage, uniqueEmail('member-view-owner'));
      await createProject(ownerPage, 'Member View Project');
      await ownerPage.getByRole('link', { name: 'Member View Project' }).click();

      await ownerPage.getByRole('button', { name: 'Информация' }).click();
      const codeRow = ownerPage.locator('p', { hasText: 'Код:' });
      const codeText = await codeRow.innerText();
      const code = codeText.replace('Код:', '').trim();

      await registerUser(memberPage, uniqueEmail('member-view-member'));
      await memberPage.getByLabel('Код проекта').fill(code);
      await memberPage.getByRole('button', { name: 'Вступить' }).click();

      await ownerPage.reload();
      await ownerPage.getByRole('link', { name: 'Member View Project' }).click();
      await ownerPage.getByRole('button', { name: 'Принять' }).click();
      await expect(ownerPage.getByText('Заявки на вступление')).not.toBeVisible();

      await memberPage.reload();
      await memberPage.getByRole('link', { name: 'Member View Project' }).click();
      await expect(memberPage.getByText('Участник')).toBeVisible();

      await memberPage.getByRole('button', { name: 'Информация' }).click();
      await expect(memberPage.getByText('Роль: Участник')).toBeVisible();
      await expect(memberPage.getByText('Заявки на вступление')).not.toBeVisible();
    } finally {
      await ownerContext.close();
      await memberContext.close();
    }
  });
});
