import type { Page } from '@playwright/test';

export function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

export async function registerUser(page: Page, email: string, password = 'password123') {
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill(password);
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
  await page.waitForURL('**/homepage');
}

export async function createProject(page: Page, name: string) {
  await page.getByPlaceholder('Название проекта').fill(name);
  await page.getByRole('button', { name: 'Создать' }).click();
  await page.getByRole('link', { name }).waitFor();
}
