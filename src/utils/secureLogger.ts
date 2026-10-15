/**
 * Secure logging + error surfacing.
 *
 * Production builds must never leak database messages, stack traces or payloads
 * to the browser console (OWASP A09 - Security Logging & Monitoring Failures /
 * A05 - Security Misconfiguration). Use these helpers instead of console.*.
 */

const isDev = import.meta.env.DEV;

/** Debug information. Silently dropped in production builds. */
export const devLog = (...args: unknown[]): void => {
  if (isDev) console.log(...args);
};

export const devWarn = (...args: unknown[]): void => {
  if (isDev) console.warn(...args);
};

/**
 * Logs an error with context. In production only a short, non-technical marker
 * is emitted so no schema names, SQL text or stack traces are exposed.
 */
export const devError = (context: string, error?: unknown): void => {
  if (isDev) {
    console.error(`[${context}]`, error);
  } else {
    console.error(`Operación fallida: ${context}`);
  }
};

/** Generic, user-facing messages. Never interpolate raw backend errors here. */
export const FRIENDLY_ERRORS = {
  load: 'No se pudieron cargar los datos. Intente nuevamente.',
  save: 'No se pudo guardar la información. Intente nuevamente.',
  delete: 'No se pudo eliminar el registro. Intente nuevamente.',
  auth: 'No fue posible completar la autenticación. Verifique sus datos.',
  validation: 'Revise los datos ingresados: hay campos inválidos o incompletos.',
  permission: 'No tiene permisos para realizar esta acción.',
  rateLimit: 'Demasiados intentos. Espere un momento antes de volver a intentar.',
  generic: 'Ocurrió un error inesperado. Intente nuevamente.',
} as const;

export type FriendlyErrorKind = keyof typeof FRIENDLY_ERRORS;

/**
 * Maps any thrown value to a safe, friendly message. Permission/rate-limit
 * hints are detected without echoing the original text.
 */
export const toFriendlyMessage = (error: unknown, fallback: FriendlyErrorKind = 'generic'): string => {
  const raw = error instanceof Error ? error.message.toLowerCase() : '';
  if (raw.includes('row-level security') || raw.includes('permission') || raw.includes('not authorized')) {
    return FRIENDLY_ERRORS.permission;
  }
  if (raw.includes('rate limit') || raw.includes('too many')) {
    return FRIENDLY_ERRORS.rateLimit;
  }
  return FRIENDLY_ERRORS[fallback];
};
