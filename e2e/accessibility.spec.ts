import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function expectNoSeriousViolations(page: Page) {
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
