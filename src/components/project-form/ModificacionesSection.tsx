import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineField } from "@/components/ui/inline-field";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, FileEdit, Pencil, Trash2 } from "lucide-react";
import { BudgetModification, CostoDirectoProyecto } from "@/types/project";
import {
  COSTO_KEYS,
  COSTO_LABELS,
  consolidatedCosto,
  emptyPercentages,
  fmtL,
  modificationAmounts,
  subTotalCosto,
  sumPercentages,
  totalCosto,
} from "@/utils/budgetModifications";
import { cn } from "@/lib/utils";

interface Props {
  presupuestoInicial: CostoDirectoProyecto;
  modificaciones: BudgetModification[];
  onChange: (next: BudgetModification[]) => void;
  onAutoSave?: (next: BudgetModification[]) => Promise<void> | void;
  readOnly?: boolean;
}

type Draft = {
  id: string | null;
  numero: string;
  fechaEmision: string;
  fechaNuevoPlazo: string;
  montoAmpliado: number;
  porcentajes: Record<string, number>;
};

const emptyDraft = (): Draft => ({
  id: null,
  numero: '',
  fechaEmision: '',
  fechaNuevoPlazo: '',
  montoAmpliado: 0,
  porcentajes: emptyPercentages(),
});

const ModificacionesSection: React.FC<Props> = ({
  presupuestoInicial,
  modificaciones,
  onChange,
  onAutoSave,
  readOnly = false,
}) => {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  // Raw text per rubro so the user can type decimals like "12.5" or "33.33".
  const [pctText, setPctText] = useState<Record<string, string>>({});

  const pctTotal = useMemo(() => sumPercentages(draft.porcentajes), [draft.porcentajes]);
  const pctValid = Math.abs(pctTotal - 100) < 0.0001;
  const canSave = !readOnly && pctValid && draft.numero.trim() !== '' && draft.montoAmpliado > 0;

  const consolidado = useMemo(
    () => consolidatedCosto(presupuestoInicial, modificaciones),
    [presupuestoInicial, modificaciones],
  );

  const persist = (next: BudgetModification[]) => {
    onChange(next);
    onAutoSave?.(next);
  };

  const handleSave = () => {
    if (!canSave) return;
    const entry: BudgetModification = {
      id: draft.id || crypto.randomUUID(),
      numero: draft.numero.trim(),
      fechaEmision: draft.fechaEmision,
      fechaNuevoPlazo: draft.fechaNuevoPlazo,
      montoAmpliado: Number(draft.montoAmpliado) || 0,
      porcentajes: { ...draft.porcentajes },
    };
    const next = draft.id
      ? modificaciones.map((m) => (m.id === draft.id ? entry : m))
      : [...modificaciones, entry];
    persist(next);
    setDraft(emptyDraft());
    setPctText({});
  };

  const handleEdit = (m: BudgetModification) => {
    const porcentajes = { ...emptyPercentages(), ...m.porcentajes };
    setDraft({
      id: m.id,
      numero: m.numero,
      fechaEmision: m.fechaEmision,
      fechaNuevoPlazo: m.fechaNuevoPlazo,
      montoAmpliado: m.montoAmpliado,
      porcentajes,
    });
    const texts: Record<string, string> = {};
    Object.keys(porcentajes).forEach((k) => {
      texts[k] = String(porcentajes[k] ?? 0);
    });
    setPctText(texts);
  };

  const handleDelete = (id: string) => {
    persist(modificaciones.filter((m) => m.id !== id));
    if (draft.id === id) {
      setDraft(emptyDraft());
      setPctText({});
    }
  };

  const setPct = (key: string, value: string) => {
    // Keep only digits and a single decimal separator so "12.5" / "33.33" work.
    let clean = value.replace(/[^\d.]/g, '');
    const firstDot = clean.indexOf('.');
    if (firstDot !== -1) {
      clean = clean.slice(0, firstDot + 1) + clean.slice(firstDot + 1).replace(/\./g, '');
    }
    setPctText((t) => ({ ...t, [key]: clean }));
    const n = parseFloat(clean);
    setDraft((d) => ({
      ...d,
      porcentajes: { ...d.porcentajes, [key]: Number.isFinite(n) ? n : 0 },
    }));
  };

  return (
    <div className="space-y-6 text-left">
      {!readOnly && (
        <Card className="border-border">
          <CardHeader className="bg-muted text-left">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FileEdit className="h-5 w-5 text-primary" />
              {draft.id ? 'Editar Modificación' : 'Registrar Modificación'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <InlineField label="Número" htmlFor="mod-numero" leftAligned>
              <Input
                id="mod-numero"
                value={draft.numero}
                placeholder="Modificacion 1"
                onChange={(e) => setDraft((d) => ({ ...d, numero: e.target.value }))}
              />
            </InlineField>
            <InlineField label="Fecha de emisión" htmlFor="mod-emision" leftAligned>
              <Input
                id="mod-emision"
                type="date"
                value={draft.fechaEmision}
                onChange={(e) => setDraft((d) => ({ ...d, fechaEmision: e.target.value }))}
              />
            </InlineField>
            <InlineField label="Fecha de Nuevo plazo" htmlFor="mod-plazo" leftAligned>
              <Input
                id="mod-plazo"
                type="date"
                value={draft.fechaNuevoPlazo}
                onChange={(e) => setDraft((d) => ({ ...d, fechaNuevoPlazo: e.target.value }))}
              />
            </InlineField>
            <InlineField label="Monto ampliado (L)" htmlFor="mod-monto" leftAligned>
              <CurrencyInput
                id="mod-monto"
                value={draft.montoAmpliado}
                onChange={(v) => setDraft((d) => ({ ...d, montoAmpliado: v }))}
              />
            </InlineField>

            <div className="pt-2 border-t border-border">
              <p className="font-semibold text-sm mb-3">Asignación porcentual (%)</p>
              <div className="space-y-3">
                {COSTO_KEYS.map((key) => (
                  <InlineField key={key} label={`${COSTO_LABELS[key]} (%)`} htmlFor={`mod-pct-${key}`} leftAligned>
                    <div className="flex items-center gap-3">
                      <Input
                        id={`mod-pct-${key}`}
                        type="text"
                        inputMode="decimal"
                        step="0.01"
                        value={pctText[key] ?? String(draft.porcentajes[key] ?? 0)}
                        onChange={(e) => setPct(key as string, e.target.value)}
                        className="max-w-[8rem]"
                      />
                      <span className="text-sm text-muted-foreground">
                        {fmtL((Number(draft.montoAmpliado) || 0) * (Number(draft.porcentajes[key]) || 0) / 100)}
                      </span>
                    </div>
                  </InlineField>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-100 px-4 py-2 -mx-6 border-t border-border">
              <span className="font-bold">Total asignado:</span>
              <span className={cn("font-bold", pctValid ? "text-foreground" : "text-destructive")}>
                {pctTotal.toLocaleString('en-US', { maximumFractionDigits: 4 })}%
              </span>
            </div>

            {!pctValid && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {pctTotal < 100
                    ? `Falta asignar ${(100 - pctTotal).toLocaleString('en-US', { maximumFractionDigits: 4 })}% para completar el 100%.`
                    : `Excede el 100% por ${(pctTotal - 100).toLocaleString('en-US', { maximumFractionDigits: 4 })}%.`}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button type="button" onClick={handleSave} disabled={!canSave}>
                Guardar
              </Button>
              {draft.id && (
                <Button type="button" variant="outline" onClick={() => setDraft(emptyDraft())}>
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla comparativa dinámica */}
      <Card className="border-border">
        <CardHeader className="bg-muted text-left">
          <CardTitle className="text-foreground">Tabla Comparativa</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-border">
                  <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Rubro</th>
                  <th className="text-right px-4 py-2 font-semibold whitespace-nowrap">Presupuesto Inicial</th>
                  {modificaciones.map((m) => (
                    <th key={m.id} className="text-right px-4 py-2 font-semibold whitespace-nowrap">
                      {m.numero || 'Modificación'}
                    </th>
                  ))}
                  <th className="text-right px-4 py-2 font-semibold whitespace-nowrap bg-slate-200">
                    Costo Presupuestado
                  </th>
                </tr>
              </thead>
              <tbody>
                {COSTO_KEYS.filter((k) => k !== 'utilidad').map((key) => (
                  <tr key={key} className="border-b border-border">
                    <td className="px-4 py-2">{COSTO_LABELS[key]} (L)</td>
                    <td className="px-4 py-2 text-right">{fmtL(Number(presupuestoInicial?.[key]) || 0)}</td>
                    {modificaciones.map((m) => (
                      <td key={m.id} className="px-4 py-2 text-right">
                        {fmtL(modificationAmounts(m)[key])}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right font-medium bg-slate-50">{fmtL(consolidado[key])}</td>
                  </tr>
                ))}

                <tr className="border-b border-border bg-slate-100 font-bold">
                  <td className="px-4 py-2">Sub-Total Costo</td>
                  <td className="px-4 py-2 text-right">{fmtL(subTotalCosto(presupuestoInicial))}</td>
                  {modificaciones.map((m) => (
                    <td key={m.id} className="px-4 py-2 text-right">
                      {fmtL(subTotalCosto(modificationAmounts(m)))}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right bg-slate-200">{fmtL(subTotalCosto(consolidado))}</td>
                </tr>

                <tr className="border-b border-border">
                  <td className="px-4 py-2">Utilidad (L)</td>
                  <td className="px-4 py-2 text-right">{fmtL(Number(presupuestoInicial?.utilidad) || 0)}</td>
                  {modificaciones.map((m) => (
                    <td key={m.id} className="px-4 py-2 text-right">
                      {fmtL(modificationAmounts(m).utilidad)}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right font-medium bg-slate-50">{fmtL(consolidado.utilidad)}</td>
                </tr>

                <tr className="bg-slate-200 font-bold">
                  <td className="px-4 py-2">Monto de Proyecto</td>
                  <td className="px-4 py-2 text-right">{fmtL(totalCosto(presupuestoInicial))}</td>
                  {modificaciones.map((m) => (
                    <td key={m.id} className="px-4 py-2 text-right">
                      {fmtL(totalCosto(modificationAmounts(m)))}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right">{fmtL(totalCosto(consolidado))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Historial */}
      <Card className="border-border">
        <CardHeader className="bg-muted text-left">
          <CardTitle className="text-foreground">Historial de Modificaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {modificaciones.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No hay modificaciones registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-border">
                    <th className="text-left px-4 py-2 font-semibold">Número</th>
                    <th className="text-left px-4 py-2 font-semibold">Fecha emisión</th>
                    <th className="text-left px-4 py-2 font-semibold">Nuevo plazo</th>
                    <th className="text-right px-4 py-2 font-semibold">Monto ampliado</th>
                    {!readOnly && <th className="text-right px-4 py-2 font-semibold">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {modificaciones.map((m) => (
                    <tr key={m.id} className="border-b border-border">
                      <td className="px-4 py-2">{m.numero}</td>
                      <td className="px-4 py-2">{m.fechaEmision || '—'}</td>
                      <td className="px-4 py-2">{m.fechaNuevoPlazo || '—'}</td>
                      <td className="px-4 py-2 text-right">{fmtL(m.montoAmpliado)}</td>
                      {!readOnly && (
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          <Button type="button" size="sm" variant="ghost" onClick={() => handleEdit(m)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDelete(m.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModificacionesSection;
