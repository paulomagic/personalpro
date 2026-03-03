interface CaptchaBypassPolicyInput {
  captchaEnabled: boolean;
  widgetFailed: boolean;
  strictMode: boolean;
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
  return input.captchaEnabled && input.widgetFailed && !input.strictMode;
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
    'timeout',
    'network'
  ];

  return transientMarkers.some((marker) => normalized.includes(marker));
}
