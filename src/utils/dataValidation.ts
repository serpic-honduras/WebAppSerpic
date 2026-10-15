/**
 * Strict input validation & sanitization for financial records.
 *
 * All user-provided text is sanitized (tags/control chars stripped) and all
 * monetary values are coerced to finite, non-negative numbers before they reach
 * the database. Queries always go through the parameterized Supabase client, so
 * no SQL string is ever built from user input.
 */
import { z } from 'zod';

/** Strips HTML/script markup and control characters from free text. */
export const sanitizeText = (input: unknown, maxLength = 500): string => {
  if (input == null) return '';
  return String(input)
    .replace(/<[^>]*>/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/javascript:/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLength);
};

/** Coerces any value to a safe money amount: finite, non-negative, 2 decimals. */
export const sanitizeAmount = (value: unknown, { allowNegative = false, max = 1e12 } = {}): number => {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(n)) return 0;
  const bounded = Math.min(Math.abs(n), max);
  const signed = allowNegative && n < 0 ? -bounded : bounded;
  return Math.round(signed * 100) / 100;
};

/** ISO date (YYYY-MM-DD) check with real-calendar validation. */
export const isValidISODate = (value: unknown): boolean => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};

/** Optional-but-valid ISO date; ordered range when both ends are present. */
export const isValidDateRange = (start?: string, end?: string): boolean => {
  if (start && !isValidISODate(start)) return false;
  if (end && !isValidISODate(end)) return false;
  if (start && end) return start <= end;
  return true;
};

// ---------- zod primitives ----------

export const moneySchema = z
  .number({ invalid_type_error: 'Debe ser un valor numérico' })
  .finite('Monto inválido')
  .min(0, 'No se permiten montos negativos')
  .max(1e12, 'Monto fuera de rango');

export const isoDateSchema = z.string().refine(isValidISODate, 'Fecha inválida (use AAAA-MM-DD)');
export const optionalIsoDateSchema = z
  .string()
  .refine((v) => v === '' || isValidISODate(v), 'Fecha inválida (use AAAA-MM-DD)');

export const shortTextSchema = (max = 120, label = 'Texto') =>
  z
    .string()
    .transform((v) => sanitizeText(v, max))
    .refine((v) => v.length > 0, `${label} es obligatorio`);

// ---------- domain schemas ----------

export const anticipoSchema = z.object({
  monto: moneySchema.refine((v) => v > 0, 'El monto del anticipo debe ser mayor a cero'),
  fecha: isoDateSchema,
});

export const estimacionInputSchema = z
  .object({
    numero: shortTextSchema(20, 'El número de estimación'),
    fechaInicio: optionalIsoDateSchema,
    fechaFin: optionalIsoDateSchema,
    monto: moneySchema,
    escalatorias: moneySchema,
    adminDelegada: moneySchema,
    montoBruto: moneySchema.refine((v) => v > 0, 'El monto bruto debe ser mayor a cero'),
    deduccionAnticipo: moneySchema,
    deduccionCalidad: moneySchema,
    materialesAlmacenados: moneySchema,
    devolucionMaterialesAlmacenados: moneySchema,
  })
  .refine((d) => isValidDateRange(d.fechaInicio || undefined, d.fechaFin || undefined), {
    message: 'El período es inválido: la fecha final debe ser posterior a la inicial',
    path: ['fechaFin'],
  })
  .refine((d) => d.deduccionAnticipo + d.deduccionCalidad <= d.montoBruto * 1.5, {
    message: 'Las deducciones exceden un rango razonable del monto bruto',
    path: ['deduccionAnticipo'],
  });

export const gastoInputSchema = z.object({
  fecha: isoDateSchema,
  descripcion: z.string().transform((v) => sanitizeText(v, 300)),
  montoPagado: moneySchema.refine((v) => v > 0, 'El monto pagado debe ser mayor a cero'),
  subcontratistaId: z.string().trim().min(1, 'Seleccione un subcontratista').max(64),
  tipoGasto: z.string().trim().min(1, 'Seleccione el tipo de gasto'),
  subcategoriaCostoDirecto: z.string().trim().max(40).optional(),
});

export const subcontratoInputSchema = z.object({
  nombre: shortTextSchema(120, 'El nombre del subcontratista'),
  descripcion: z.string().transform((v) => sanitizeText(v, 300)).optional(),
  montoContrato: moneySchema,
});

/** Returns the first validation message, or null when the payload is valid. */
export const firstIssue = (result: z.SafeParseReturnType<unknown, unknown>): string | null =>
  result.success ? null : result.error.issues[0]?.message ?? 'Datos inválidos';
