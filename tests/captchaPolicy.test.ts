import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  canBypassCaptchaWidgetFailure,
  isCaptchaServiceUnavailableError,
  parseBooleanEnvFlag,
  resolveCaptchaStrictMode
} from '../services/auth/captchaPolicy';

test('parseBooleanEnvFlag parses valid boolean-like values', () => {
  assert.equal(parseBooleanEnvFlag('true'), true);
  assert.equal(parseBooleanEnvFlag('1'), true);
  assert.equal(parseBooleanEnvFlag('FALSE'), false);
  assert.equal(parseBooleanEnvFlag('0'), false);
});

test('resolveCaptchaStrictMode defaults to false and respects explicit env override', () => {
  assert.equal(resolveCaptchaStrictMode(undefined), false);
  assert.equal(resolveCaptchaStrictMode('false'), false);
  assert.equal(resolveCaptchaStrictMode('true'), true);
});

test('canBypassCaptchaWidgetFailure allows bypass only when strict mode is disabled', () => {
  assert.equal(
    canBypassCaptchaWidgetFailure({
      captchaEnabled: true,
      widgetFailed: true,
      strictMode: false
    }),
    true
  );

  assert.equal(
    canBypassCaptchaWidgetFailure({
      captchaEnabled: true,
      widgetFailed: true,
      strictMode: true
    }),
    false
  );
});

test('isCaptchaServiceUnavailableError detects infrastructure-style errors', () => {
  assert.equal(isCaptchaServiceUnavailableError('Validation service not configured'), true);
  assert.equal(isCaptchaServiceUnavailableError('Falha na validação do CAPTCHA.'), false);
});
