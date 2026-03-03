interface CaptchaBypassPolicyInput {
  captchaEnabled: boolean;
  widgetFailed: boolean;
  strictMode: boolean;
  failureReason?: string;
}

export function parseBooleanEnvFlag(value?: string): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return null;
}

export function resolveCaptchaStrictMode(
  strictModeEnvValue: string | undefined
): boolean {
  const parsed = parseBooleanEnvFlag(strictModeEnvValue);
  return parsed ?? false;
}

export function canBypassCaptchaWidgetFailure(input: CaptchaBypassPolicyInput): boolean {
  if (!input.captchaEnabled || !input.widgetFailed) return false;
  if (!input.strictMode) return true;
  return isCaptchaServiceUnavailableError(input.failureReason);
}

export function isCaptchaServiceUnavailableError(error?: string): boolean {
  if (!error) return false;
  const normalized = error.toLowerCase();
  const transientMarkers = [
    'indispon',
    'temporari',
    'não foi possível validar',
    'nao foi possivel validar',
    'validation service',
    'origin not allowed',
    'invalid domain',
    'invalid sitekey',
    'invalid site key',
    '400020',
    'timeout',
    'network'
  ];

  return transientMarkers.some((marker) => normalized.includes(marker));
}
