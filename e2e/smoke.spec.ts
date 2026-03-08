import { expect, test } from '@playwright/test';

test('demo login reaches dashboard', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('demo-login-button').click();

  await expect(page.getByText('Gerar Treino com IA')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Alunos' }).first()).toBeVisible();
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

test('demo user can open privacy controls from settings', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('demo-login-button').click();

  await page.getByRole('button', { name: 'Abrir perfil' }).click();
  await expect(page.getByText('Configurações')).toBeVisible();

  await page.getByRole('button', { name: /Privacidade e Dados/i }).click();
  const privacyDialog = page.getByRole('dialog', { name: 'Privacidade e Dados' });
  await expect(privacyDialog).toBeVisible();
  await expect(privacyDialog.getByRole('button', { name: 'Exportar Dados LGPD' })).toBeVisible();
  await expect(privacyDialog.getByText('Histórico LGPD')).toBeVisible();
});

test('invite token invalid path shows error feedback', async ({ page }) => {
  await page.goto('/?invite=invalid-token-e2e');

  await expect(page.getByText('Convite inválido ou expirado')).toBeVisible();
});

test('offline navigation falls back to offline shell', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.reload();

  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));

  await context.setOffline(true);
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Sem conexão no momento.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();

  await context.setOffline(false);
});
