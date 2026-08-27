import { test, expect, type Browser } from '@playwright/test';
import { registerUser, uniqueEmail } from './helpers';

async function newUserPage(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { context, page };
}

test.describe('Auth', () => {
  test('registering a new user redirects to the home page with an empty state', async ({
    page,
  }) => {
    await registerUser(page, uniqueEmail('auth'));

    await expect(page).toHaveURL(/\/homepage$/);
    await expect(page.getByRole('heading', { name: 'Обзор' })).toBeVisible();
    await expect(page.getByText('У вас пока нет проектов с задачами.')).toBeVisible();
  });

  test('logging in with valid credentials redirects to the home page', async ({ browser }) => {
    const email = uniqueEmail('login-success');
    const password = 'password123';

    const { context: registerContext, page: registerPage } = await newUserPage(browser);
    await registerUser(registerPage, email, password);
    await registerContext.close();

    const { context: loginContext, page: loginPage } = await newUserPage(browser);
    try {
      await loginPage.goto('/login');
      await loginPage.getByLabel('Email').fill(email);
      await loginPage.getByLabel('Пароль').fill(password);
      await loginPage.getByRole('button', { name: 'Войти' }).click();

      await expect(loginPage).toHaveURL(/\/homepage$/);
    } finally {
      await loginContext.close();
    }
  });

  test('logging in with an incorrect password shows a generic error and stays on /login', async ({
    browser,
  }) => {
    const email = uniqueEmail('login-wrong-password');

    const { context: registerContext, page: registerPage } = await newUserPage(browser);
    await registerUser(registerPage, email, 'password123');
    await registerContext.close();

    const { context: loginContext, page: loginPage } = await newUserPage(browser);
    try {
      await loginPage.goto('/login');
      await loginPage.getByLabel('Email').fill(email);
      await loginPage.getByLabel('Пароль').fill('wrongpassword');
      await loginPage.getByRole('button', { name: 'Войти' }).click();

      await expect(loginPage.getByRole('alert')).toHaveText('Неверный email или пароль');
      await expect(loginPage).toHaveURL(/\/login$/);
    } finally {
      await loginContext.close();
    }
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
