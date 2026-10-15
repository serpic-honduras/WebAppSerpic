import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCompareArrows } from "lucide-react";
import { CostoDirectoProyecto, Subcontrato, Gasto, TipoGasto, Estimacion } from "@/types/project";
import { cn } from "@/lib/utils";

interface Props {
  presupuestado: CostoDirectoProyecto;
  dinamico: CostoDirectoProyecto;
  subcontratos: Subcontrato[];
  gastos: Gasto[];
  estimaciones?: Estimacion[];
  initialAmount: number;
}

const ROWS: { key: keyof CostoDirectoProyecto; label: string }[] = [
  { key: 'costoDirecto', label: 'Costo Directo' },
  { key: 'indirectosDeObra', label: 'Costo Indirecto de Obra' },
  { key: 'fianzas', label: 'Fianzas' },
  { key: 'seguros', label: 'Seguros' },
  { key: 'administracion', label: 'Administración' },
  { key: 'escalatoria', label: 'Escalatorias' },
  { key: 'imprevistos', label: 'Imprevistos' },
  { key: 'financieros', label: 'Financieros' },
  { key: 'utilidad', label: 'Utilidad' },
];

const TIPO_TO_KEY: Record<TipoGasto, keyof CostoDirectoProyecto> = {
  'Costo Indirecto de Obra': 'indirectosDeObra',
  'Fianzas': 'fianzas',
  'Seguros': 'seguros',
  'Administración': 'administracion',
  'Escalatorias': 'escalatoria',
  'Imprevistos': 'imprevistos',
  'Financieros': 'financieros',
  'Costo Directo': 'costoDirecto',
};

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CostoDiferencialSection: React.FC<Props> = ({
  presupuestado,
  dinamico,
  gastos,
  estimaciones,
  initialAmount,
}) => {
  // Compute Dinámico from gastos (live) per bucket. Subcontratos are NOT
  // counted here — only actual expense entries affect Costo Dinámico.
  type Key = keyof CostoDirectoProyecto;
  const dynVals: Record<string, number> = {
    costoDirecto: 0,
    indirectosDeObra: 0,
    fianzas: 0,
    seguros: 0,
    administracion: 0,
    escalatoria: 0,
    imprevistos: 0,
    financieros: 0,
    utilidad: 0,
  };
  for (const g of gastos || []) {
    const k = TIPO_TO_KEY[g.tipoGasto];
    if (k) dynVals[k as string] += Number(g.montoPagado) || 0;
  }

  // Utilidad dinámica = Total Monto Bruto de Estimaciones - suma de los 8 costos dinámicos
  const COST_KEYS = [
    'costoDirecto', 'indirectosDeObra', 'fianzas', 'seguros',
    'administracion', 'escalatoria', 'imprevistos', 'financieros',
  ];
  const totalBruto = (estimaciones || []).reduce((s, e) => s + (Number(e.montoBruto) || 0), 0);
  dynVals.utilidad = totalBruto - COST_KEYS.reduce((s, k) => s + (dynVals[k] || 0), 0);

  const pTotal = ROWS.reduce((s, r) => s + (Number(presupuestado[r.key]) || 0), 0);
  const dTotal = ROWS.reduce((s, r) => s + (dynVals[r.key as string] || 0), 0);

  // Presupuestado - Dinámico. Positive = ahorro (normal). Negative = sobrecosto (red).
  const row = (
    label: string,
    p: number,
    d: number,
    variant: 'normal' | 'subtotal' | 'total' = 'normal',
  ) => {
    const diff = p - d;
    const isSubtotal = variant === 'subtotal';
    const isTotal = variant === 'total';
    return (
      <div
        key={label}
        className={cn(
          "grid grid-cols-4 gap-2 py-2 text-sm",
          isSubtotal && "border-t-2 border-gray-300 bg-slate-100 font-bold",
          isTotal && "border-t-2 border-slate-400 border-b border-border bg-slate-200 font-bold",
          !isSubtotal && !isTotal && "border-b border-border last:border-0",
        )}
      >
        <span className={cn("text-left", (isSubtotal || isTotal) && "font-bold")}>{label}</span>
        <span className={cn("text-right", (isSubtotal || isTotal) && "font-bold")}>L {fmt(p)}</span>
        <span className={cn("text-right", d < 0 && !isSubtotal && !isTotal && "text-destructive", (isSubtotal || isTotal) && "font-bold")}>
          L {fmt(d)}
        </span>
        <span className={cn("text-right", diff < 0 && !isSubtotal && !isTotal && "text-destructive", (isSubtotal || isTotal) ? "font-bold" : "font-semibold")}>
          L {fmt(diff)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-left">
            <GitCompareArrows className="h-5 w-5" />
            Costo Diferencial (Presupuestado − Dinámico)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 pb-2 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
            <span className="text-left">Concepto</span>
            <span className="text-right">Presupuestado</span>
            <span className="text-right">Dinámico</span>
            <span className="text-right">Diferencia</span>
          </div>
          {ROWS.filter((r) => r.key !== 'utilidad').map((r) =>
            row(r.label, Number(presupuestado[r.key]) || 0, dynVals[r.key as string] || 0),
          )}
          {row(
            'Sub-Total Costo',
            COST_KEYS.reduce((s, k) => s + (Number((presupuestado as any)[k]) || 0), 0),
            COST_KEYS.reduce((s, k) => s + (dynVals[k] || 0), 0),
            'subtotal',
          )}
          {row('Utilidad', Number(presupuestado.utilidad) || 0, dynVals.utilidad || 0)}
          {row('Total Costo', pTotal, dTotal, 'total')}

        </CardContent>
      </Card>
    </div>
  );
};

export default CostoDiferencialSection;
