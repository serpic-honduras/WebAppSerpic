import { BudgetModification, CostoDirectoProyecto } from "@/types/project";

export const COSTO_KEYS: (keyof CostoDirectoProyecto)[] = [
  'costoDirecto',
  'indirectosDeObra',
  'fianzas',
  'seguros',
  'administracion',
  'escalatoria',
  'imprevistos',
  'financieros',
  'utilidad',
];

export const COSTO_LABELS: Record<string, string> = {
  costoDirecto: 'Costo Directo',
  indirectosDeObra: 'Costo Indirecto de Obra',
  fianzas: 'Fianzas',
  seguros: 'Seguros',
  administracion: 'Administración',
  escalatoria: 'Escalatorias',
  imprevistos: 'Imprevistos',
  financieros: 'Financieros',
  utilidad: 'Utilidad',
};

export const emptyCosto = (): CostoDirectoProyecto => ({
  costoDirecto: 0,
  indirectosDeObra: 0,
  fianzas: 0,
  seguros: 0,
  administracion: 0,
  escalatoria: 0,
  imprevistos: 0,
  financieros: 0,
  utilidad: 0,
});

export const emptyPercentages = (): Record<string, number> =>
  COSTO_KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {} as Record<string, number>);

/** Monto asignado a cada rubro de una modificación: monto ampliado * (% / 100). */
export const modificationAmounts = (mod: BudgetModification): CostoDirectoProyecto => {
  const monto = Number(mod.montoAmpliado) || 0;
  const out = emptyCosto();
  COSTO_KEYS.forEach((k) => {
    out[k] = (monto * (Number(mod.porcentajes?.[k]) || 0)) / 100;
  });
  return out;
};

/** Suma de los 8 rubros (sin Utilidad). */
export const subTotalCosto = (v: CostoDirectoProyecto): number =>
  COSTO_KEYS.filter((k) => k !== 'utilidad').reduce((s, k) => s + (Number(v[k]) || 0), 0);

/** Sub-Total + Utilidad. */
export const totalCosto = (v: CostoDirectoProyecto): number =>
  subTotalCosto(v) + (Number(v.utilidad) || 0);

/** Presupuesto inicial + todas las modificaciones, rubro por rubro. */
export const consolidatedCosto = (
  inicial: CostoDirectoProyecto,
  mods: BudgetModification[],
): CostoDirectoProyecto => {
  const out = emptyCosto();
  COSTO_KEYS.forEach((k) => {
    out[k] = Number(inicial?.[k]) || 0;
  });
  (mods || []).forEach((m) => {
    const amounts = modificationAmounts(m);
    COSTO_KEYS.forEach((k) => {
      out[k] = (out[k] as number) + amounts[k];
    });
  });
  return out;
};

export const sumPercentages = (p: Record<string, number>): number =>
  COSTO_KEYS.reduce((s, k) => s + (Number(p?.[k]) || 0), 0);

export const fmtL = (n: number) =>
  `L ${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
