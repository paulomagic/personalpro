import { expect, test } from '@playwright/test';

test('demo login reaches dashboard', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('demo-login-button').click();

  await expect(page.getByText('Gerar Treino com IA')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Alunos' })).toBeVisible();
});

test('demo user can open client and start quick workout', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('demo-login-button').click();

  await page.getByTestId('dashboard-client-card-1').click();
  await expect(page.getByTestId('quick-workout-button')).toBeVisible();

  await page.getByTestId('quick-workout-button').click();
  await expect(page.getByTestId('training-execution-screen')).toBeVisible();
  await expect(page.getByTestId('complete-set-button')).toBeVisible();
});

test('invite token invalid path shows error feedback', async ({ page }) => {
  await page.goto('/?invite=invalid-token-e2e');

  await expect(page.getByText('Convite inválido ou expirado')).toBeVisible();
});

