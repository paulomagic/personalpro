import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function expectNoSeriousViolations(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
        caret-color: auto !important;
      }

      [style*="opacity: 0"] {
        opacity: 1 !important;
      }

      [style*="transform: translate"] {
        transform: none !important;
      }
    `
  });
  await page.waitForTimeout(350);
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  const blockingViolations = accessibilityScanResults.violations.filter((violation) =>
    violation.impact === 'critical' || violation.impact === 'serious'
  );

  expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([]);
}

test('login screen has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('demo-login-button')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await expectNoSeriousViolations(page);
});

test('dashboard shell has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('demo-login-button').click();
  await expect(page.getByText('Gerar Treino com IA')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await expectNoSeriousViolations(page);
});

test('clients screen has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('demo-login-button').click();
  await page.getByRole('button', { name: 'Alunos' }).first().click();
  await expect(page.getByRole('heading', { name: 'Alunos' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await expectNoSeriousViolations(page);
});

test('calendar screen has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('demo-login-button').click();
  await page.getByRole('button', { name: 'Agenda' }).first().click();
  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await expectNoSeriousViolations(page);
});

test('settings profile modal has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('demo-login-button').click();
  await page.getByRole('button', { name: 'Abrir perfil' }).click();
  await expect(page.getByText('Configurações')).toBeVisible();
  await page.getByRole('button', { name: 'Editar perfil' }).click();
  const profileDialog = page.getByRole('dialog', { name: 'Editar Perfil' });
  await expect(profileDialog).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('settings help modal has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('demo-login-button').click();
  await page.getByRole('button', { name: 'Abrir perfil' }).click();
  await expect(page.getByText('Configurações')).toBeVisible();
  await page.getByRole('button', { name: 'Ajuda' }).click();
  const helpDialog = page.getByRole('dialog', { name: 'Ajuda' });
  await expect(helpDialog).toBeVisible();
  await expectNoSeriousViolations(page);
});
