import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calculator } from "lucide-react";
import { CostoDirectoProyecto } from "@/types/project";
import { InlineField } from "@/components/ui/inline-field";
import { CurrencyInput } from "@/components/ui/currency-input";
import { cn } from "@/lib/utils";

export interface CostBreakdownSectionProps {
  title: string;
  values: CostoDirectoProyecto;
  montoProyecto: number;
  fieldPathPrefix: string;
  onInputChange: (field: string, value: any) => void;
  /** Extra amount added on top of the "Costo Directo" row (e.g. subcontratos in Dinámico). */
  extraCostoDirecto?: number;
  extraCostoDirectoLabel?: string;
  readOnlyAll?: boolean;
  /** When provided, the given keys become read-only and display this auto-fed value. */
  autoFedValues?: Partial<Record<keyof CostoDirectoProyecto, number>>;
  /** Optional helper note rendered right below a field (e.g. the Utilidad formula). */
  fieldNotes?: Partial<Record<keyof CostoDirectoProyecto, React.ReactNode>>;
  /** Shows a "Sub-Total Costo Directo" row (8 cost items) before Utilidad. */
  showSubTotal?: boolean;

}

// 8 manual rows summed into "Total Costo Directo".
const MANUAL_FIELDS: { key: keyof CostoDirectoProyecto; label: string }[] = [
  { key: 'indirectosDeObra', label: 'Costo Indirecto de Obra' },
  { key: 'fianzas', label: 'Fianzas' },
  { key: 'seguros', label: 'Seguros' },
  { key: 'administracion', label: 'Administración' },
  { key: 'escalatoria', label: 'Escalatorias' },
  { key: 'imprevistos', label: 'Imprevistos' },
  { key: 'financieros', label: 'Financieros' },
  { key: 'utilidad', label: 'Utilidad' },
];

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CostBreakdownSection: React.FC<CostBreakdownSectionProps> = ({
  title,
  values,
  montoProyecto,
  fieldPathPrefix,
  onInputChange,
  extraCostoDirecto,
  extraCostoDirectoLabel,
  readOnlyAll = false,
  autoFedValues,
  fieldNotes,
  showSubTotal = false,
}) => {
  const isAuto = (key: keyof CostoDirectoProyecto) =>
    autoFedValues != null && autoFedValues[key] !== undefined;

  const resolveValue = (key: keyof CostoDirectoProyecto) =>
    isAuto(key) ? Number(autoFedValues![key]) || 0 : Number(values[key]) || 0;

  const costoDirectoBase = resolveValue('costoDirecto');
  const costoDirectoTotal = costoDirectoBase + (Number(extraCostoDirecto) || 0);

  const sumManuals = MANUAL_FIELDS.reduce((s, f) => s + resolveValue(f.key), 0);
  const totalCostoDirecto = costoDirectoTotal + sumManuals;
  const diferencia = (Number(montoProyecto) || 0) - totalCostoDirecto;
  const subTotalCostos =
    costoDirectoTotal +
    MANUAL_FIELDS.filter((f) => f.key !== 'utilidad').reduce((s, f) => s + resolveValue(f.key), 0);


  const renderRow = (
    key: keyof CostoDirectoProyecto,
    label: string,
    overrideDisplay?: number,
  ) => {
    const auto = isAuto(key) || overrideDisplay !== undefined;
    const autoValue = overrideDisplay !== undefined ? overrideDisplay : resolveValue(key);
    return (
      <div key={key} className="space-y-1">
      <InlineField label={`${label} (L)`} htmlFor={`${fieldPathPrefix}-${key}`} leftAligned>
        {auto ? (
          <Input
            id={`${fieldPathPrefix}-${key}`}
            type="text"
            value={`L ${fmt(autoValue)}`}
            disabled
            readOnly
            className={cn(
              "bg-muted cursor-not-allowed",
              autoValue < 0 && "text-destructive font-semibold",
            )}
          />
        ) : (
          <CurrencyInput
            id={`${fieldPathPrefix}-${key}`}
            value={Number(values[key]) || 0}
            disabled={readOnlyAll}
            onChange={(v) => onInputChange(`${fieldPathPrefix}.${key}`, v)}
          />
        )}
      </InlineField>
      {fieldNotes?.[key] ? (
        <p className="text-xs text-muted-foreground sm:pl-[var(--inline-label-width,0)]">{fieldNotes[key]}</p>
      ) : null}
      </div>
    );
  };

  return (
    <Card className="border-border">
      <CardHeader className="bg-muted text-left">
        <CardTitle className="flex items-center gap-2 text-foreground text-left">
          <Calculator className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6 text-left">
        <InlineField label="Monto de Proyecto (L)" htmlFor={`${fieldPathPrefix}-monto`} leftAligned>
          <Input
            id={`${fieldPathPrefix}-monto`}
            type="text"
            value={`L ${fmt(Number(montoProyecto) || 0)}`}
            disabled
            readOnly
            className="bg-muted cursor-not-allowed"
          />
        </InlineField>

        {/* Costo Directo: shows the base+extra when extra/auto present. */}
        {extraCostoDirecto !== undefined || isAuto('costoDirecto')
          ? renderRow('costoDirecto', 'Costo Directo', costoDirectoTotal)
          : renderRow('costoDirecto', 'Costo Directo')}

        {MANUAL_FIELDS.filter((f) => f.key !== 'utilidad').map((f) => renderRow(f.key, f.label))}

        {showSubTotal ? (
          <div className="flex justify-between items-center border-t-2 border-gray-300 bg-slate-100 px-4 py-2 -mx-6">
            <span className="font-bold text-foreground">Sub-Total Costo:</span>
            <span className="font-bold text-foreground">L {fmt(subTotalCostos)}</span>
          </div>
        ) : null}

        {renderRow('utilidad', 'Utilidad')}


        {extraCostoDirectoLabel && extraCostoDirecto !== undefined ? (
          <p className="text-xs text-muted-foreground pl-0 md:pl-[15rem]">
            {extraCostoDirectoLabel}: L {fmt(Number(extraCostoDirecto) || 0)} (incluido en Costo Directo)
          </p>
        ) : null}

        <div className="mt-2 border-t-2 border-slate-400 border-b border-border bg-slate-200 p-4 -mx-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-foreground">Total Costo:</span>
            <span className="font-bold text-lg text-foreground">
              L {fmt(totalCostoDirecto)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-foreground">Monto de Proyecto - Total Costo:</span>
            <span className={cn(
              "font-bold text-lg",
              diferencia < 0 ? "text-destructive" : "text-foreground"
            )}>
              L {fmt(diferencia)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostBreakdownSection;
