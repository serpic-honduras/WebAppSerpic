import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InlineField } from "@/components/ui/inline-field";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Estimacion, calcMontoNeto } from "@/types/project";
import { useToast } from "@/hooks/use-toast";
import { estimacionInputSchema, firstIssue, sanitizeAmount, sanitizeText } from "@/utils/dataValidation";
import { devError, toFriendlyMessage, FRIENDLY_ERRORS } from "@/utils/secureLogger";
import { FileText, Plus, Pencil, Trash2, Search, FileSpreadsheet } from "lucide-react";
import { exportRowsToExcel } from "@/utils/tableExport";


interface Props {
  estimaciones: Estimacion[];
  onChange: (next: Estimacion[]) => void;
  onAutoSave?: (next: Estimacion[]) => Promise<void>;
  readOnly?: boolean;
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatCompactDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year.slice(-2)}`;
};

interface Draft {
  numero: string;
  fechaInicio: string;
  fechaFin: string;
  monto: number;
  escalatorias: number;
  adminDelegada: number;
  montoBruto: number;
  deduccionAnticipo: number;
  deduccionCalidad: number;
  materialesAlmacenados: number;
  devolucionMaterialesAlmacenados: number;
}

const emptyDraft = (): Draft => ({
  numero: '',
  fechaInicio: '',
  fechaFin: '',
  monto: 0,
  escalatorias: 0,
  adminDelegada: 0,
  montoBruto: 0,
  deduccionAnticipo: 0,
  deduccionCalidad: 0,
  materialesAlmacenados: 0,
  devolucionMaterialesAlmacenados: 0,
});

const draftFrom = (e: Estimacion): Draft => ({
  numero: e.numero,
  fechaInicio: e.fechaInicio,
  fechaFin: e.fechaFin,
  monto: Number(e.monto) || Number(e.montoBruto) || 0,
  escalatorias: Number(e.escalatorias) || 0,
  adminDelegada: Number(e.adminDelegada) || 0,
  montoBruto: e.montoBruto,
  deduccionAnticipo: e.deduccionAnticipo,
  deduccionCalidad: e.deduccionCalidad,
  materialesAlmacenados: e.materialesAlmacenados,
  devolucionMaterialesAlmacenados: e.devolucionMaterialesAlmacenados,
});

const calcMontoBruto = (d: { monto: number; escalatorias: number; adminDelegada: number }) =>
  (Number(d.monto) || 0) + (Number(d.escalatorias) || 0) + (Number(d.adminDelegada) || 0);

const isValid = (d: Draft) => !!d.numero.trim() && calcMontoBruto(d) > 0;

interface FieldsProps {
  initial: Draft;
  idPrefix: string;
  saving: boolean;
  submitLabel: string;
  submitIcon?: React.ReactNode;
  onSubmit: (d: Draft) => Promise<boolean>;
  onCancel?: () => void;
}

/** Isolated draft state so keystrokes never re-render the history table or totals. */
const EstimacionFields = React.memo(
  ({ initial, idPrefix, saving, submitLabel, submitIcon, onSubmit, onCancel }: FieldsProps) => {
    const [d, setD] = useState<Draft>(initial);
    const valid = isValid(d);
    const montoBruto = calcMontoBruto(d);
    const neto = calcMontoNeto({ ...d, montoBruto });

    const handleSubmit = async () => {
      if (!valid || saving) return;
      const ok = await onSubmit({ ...d, montoBruto });
      if (ok && !onCancel) setD(emptyDraft());
    };

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <InlineField label="Número de Estimación" htmlFor={`${idPrefix}-num`} leftAligned>
            <Input
              id={`${idPrefix}-num`}
              value={d.numero}
              onChange={(e) => setD((s) => ({ ...s, numero: e.target.value }))}
              placeholder="ej. 01"
            />
          </InlineField>
          <InlineField label="Período de Estimación" leftAligned>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="date"
                aria-label="Fecha inicial"
                value={d.fechaInicio}
                onChange={(e) => setD((s) => ({ ...s, fechaInicio: e.target.value }))}
              />
              <Input
                type="date"
                aria-label="Fecha final"
                value={d.fechaFin}
                onChange={(e) => setD((s) => ({ ...s, fechaFin: e.target.value }))}
              />
            </div>
          </InlineField>
          <InlineField label="Monto (L)" htmlFor={`${idPrefix}-monto`} leftAligned>
            <CurrencyInput
              id={`${idPrefix}-monto`}
              value={d.monto}
              onChange={(v) => setD((s) => ({ ...s, monto: v }))}
            />
          </InlineField>
          <InlineField label="Cláusulas Escalatorias (L)" htmlFor={`${idPrefix}-esc`} leftAligned>
            <CurrencyInput
              id={`${idPrefix}-esc`}
              value={d.escalatorias}
              onChange={(v) => setD((s) => ({ ...s, escalatorias: v }))}
            />
          </InlineField>
          <InlineField label="Administración Delegada (L)" htmlFor={`${idPrefix}-admin`} leftAligned>
            <CurrencyInput
              id={`${idPrefix}-admin`}
              value={d.adminDelegada}
              onChange={(v) => setD((s) => ({ ...s, adminDelegada: v }))}
            />
          </InlineField>
          <InlineField label="Monto Bruto (L)" leftAligned>
            <div className="space-y-1">
              <Input value={fmt(montoBruto)} readOnly className="bg-muted font-medium" />
              <p className="text-xs text-muted-foreground">
                Calculado: Monto (L) + Cláusulas Escalatorias (L) + Administración Delegada (L)
              </p>
            </div>
          </InlineField>
          <InlineField label="Deducción de Anticipo (L)" htmlFor={`${idPrefix}-anticipo`} leftAligned>
            <CurrencyInput
              id={`${idPrefix}-anticipo`}
              value={d.deduccionAnticipo}
              onChange={(v) => setD((s) => ({ ...s, deduccionAnticipo: v }))}
            />
          </InlineField>
          <InlineField label="Deducción de Calidad (L)" htmlFor={`${idPrefix}-calidad`} leftAligned>
            <CurrencyInput
              id={`${idPrefix}-calidad`}
              value={d.deduccionCalidad}
              onChange={(v) => setD((s) => ({ ...s, deduccionCalidad: v }))}
            />
          </InlineField>
          <InlineField label="Materiales Almacenados (L)" htmlFor={`${idPrefix}-mat`} leftAligned>
            <CurrencyInput
              id={`${idPrefix}-mat`}
              value={d.materialesAlmacenados}
              onChange={(v) => setD((s) => ({ ...s, materialesAlmacenados: v }))}
            />
          </InlineField>
          <InlineField label="Devolución de Materiales Almacenados (L)" htmlFor={`${idPrefix}-dev-mat`} leftAligned>
            <CurrencyInput
              id={`${idPrefix}-dev-mat`}
              value={d.devolucionMaterialesAlmacenados}
              onChange={(v) => setD((s) => ({ ...s, devolucionMaterialesAlmacenados: v }))}
            />
          </InlineField>
          <InlineField label="Monto Neto (L)" leftAligned>
            <Input value={fmt(neto)} readOnly className="bg-muted font-medium" />
          </InlineField>
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          )}
          <Button type="button" onClick={handleSubmit} disabled={!valid || saving}>
            {submitIcon}
            {saving ? 'Guardando...' : submitLabel}
          </Button>
        </div>
      </div>
    );
  },
);
EstimacionFields.displayName = 'EstimacionFields';

const EstimacionesSection: React.FC<Props> = ({ estimaciones, onChange, onAutoSave, readOnly = false }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Estimacion | null>(null);
  const [toDelete, setToDelete] = useState<Estimacion | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const list = estimaciones || [];
  const listRef = useRef(list);
  listRef.current = list;

  const commit = useCallback(
    async (next: Estimacion[]) => {
      onChange(next);
      if (!onAutoSave) return true;
      setSaving(true);
      try {
        await onAutoSave(next);
        return true;
      } catch (e) {
        devError('guardar estimación', e);
        toast({ title: 'Error', description: toFriendlyMessage(e, 'save'), variant: 'destructive' });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [onChange, onAutoSave, toast],
  );

  /** Sanitizes + validates a draft before it can reach the database. */
  const validateDraft = useCallback(
    (d: Draft): Draft | null => {
      const parsed = estimacionInputSchema.safeParse({
        numero: sanitizeText(d.numero, 20),
        fechaInicio: d.fechaInicio || '',
        fechaFin: d.fechaFin || '',
        monto: sanitizeAmount(d.monto),
        escalatorias: sanitizeAmount(d.escalatorias),
        adminDelegada: sanitizeAmount(d.adminDelegada),
        montoBruto: sanitizeAmount(calcMontoBruto(d)),
        deduccionAnticipo: sanitizeAmount(d.deduccionAnticipo),
        deduccionCalidad: sanitizeAmount(d.deduccionCalidad),
        materialesAlmacenados: sanitizeAmount(d.materialesAlmacenados),
        devolucionMaterialesAlmacenados: sanitizeAmount(d.devolucionMaterialesAlmacenados),
      });
      if (!parsed.success) {
        toast({
          title: 'Datos inválidos',
          description: firstIssue(parsed) ?? FRIENDLY_ERRORS.validation,
          variant: 'destructive',
        });
        return null;
      }
      return parsed.data as Draft;
    },
    [toast],
  );

  const handleCreate = useCallback(
    async (d: Draft) => {
      const clean = validateDraft(d);
      if (!clean) return false;
      const nueva: Estimacion = {
        id: crypto.randomUUID(),
        ...clean,
        montoNeto: calcMontoNeto(clean),
        pagado: false,
      };
      return commit([...listRef.current, nueva]);
    },
    [commit, validateDraft],
  );

  const handleUpdate = useCallback(
    async (d: Draft) => {
      if (!editing) return false;
      const clean = validateDraft(d);
      if (!clean) return false;
      const next = listRef.current.map((e) =>
        e.id === editing.id ? { ...e, ...clean, montoNeto: calcMontoNeto(clean) } : e,
      );
      const ok = await commit(next);
      if (ok) setEditing(null);
      return ok;
    },
    [commit, editing, validateDraft],
  );


  const togglePagado = useCallback(
    (id: string) => {
      commit(listRef.current.map((e) => (e.id === id ? { ...e, pagado: !e.pagado } : e)));
    },
    [commit],
  );

  const confirmDelete = useCallback(async () => {
    if (!toDelete) return;
    await commit(listRef.current.filter((e) => e.id !== toDelete.id));
    setToDelete(null);
  }, [commit, toDelete]);

  const filteredEstimaciones = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list
      .filter((e) => (q ? e.numero.toLowerCase().includes(q) : true))
      .filter((e) => (filter === 'all' ? true : filter === 'paid' ? e.pagado : !e.pagado))
      .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
  }, [list, search, filter]);

  // Totals are always calculated from the filtered (search + status) set, not the global list.
  const totals = useMemo(
    () =>
      filteredEstimaciones.reduce(
        (t, e) => ({
          monto: t.monto + (Number(e.monto) || 0),
          escalatorias: t.escalatorias + (Number(e.escalatorias) || 0),
          adminDelegada: t.adminDelegada + (Number(e.adminDelegada) || 0),
          bruto: t.bruto + (Number(e.montoBruto) || 0),
          anticipo: t.anticipo + (Number(e.deduccionAnticipo) || 0),
          calidad: t.calidad + (Number(e.deduccionCalidad) || 0),
          materiales: t.materiales + (Number(e.materialesAlmacenados) || 0),
          devolucionMateriales: t.devolucionMateriales + (Number(e.devolucionMaterialesAlmacenados) || 0),
          neto: t.neto + (Number(e.montoNeto) || 0),
        }),
        { monto: 0, escalatorias: 0, adminDelegada: 0, bruto: 0, anticipo: 0, calidad: 0, materiales: 0, devolucionMateriales: 0, neto: 0 },
      ),
    [filteredEstimaciones],
  );

  const handleExport = useCallback(() => {
    exportRowsToExcel(
      filteredEstimaciones.map((e) => ({
        'N° Estimación': e.numero || '',
        'Inicio': e.fechaInicio || '',
        'Fin': e.fechaFin || '',
        'Monto (L)': Number(e.monto) || 0,
        'Cláusulas Escalatorias (L)': Number(e.escalatorias) || 0,
        'Administración Delegada (L)': Number(e.adminDelegada) || 0,
        'Monto Bruto (L)': Number(e.montoBruto) || 0,
        'Deducción Anticipo (L)': Number(e.deduccionAnticipo) || 0,
        'Deducción Calidad (L)': Number(e.deduccionCalidad) || 0,
        'Materiales Almacenados (L)': Number(e.materialesAlmacenados) || 0,
        'Devolución Mat. Almacenados (L)': Number(e.devolucionMaterialesAlmacenados) || 0,
        'Monto Neto (L)': Number(e.montoNeto) || 0,
        Estado: e.pagado ? 'Pagado' : 'No Pagado',
      })),
      'Historial de Estimaciones',
      'historial-estimaciones',
    );
  }, [filteredEstimaciones]);

  return (
    <div className="space-y-4">
      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-left flex items-center gap-2">
              <FileText className="h-5 w-5" /> Registrar Estimación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EstimacionFields
              initial={emptyDraft()}
              idPrefix="est-new"
              saving={saving}
              submitLabel="Registrar Estimación"
              submitIcon={<Plus className="h-4 w-4 mr-1" />}
              onSubmit={handleCreate}
            />
          </CardContent>
        </Card>
      )}

      <Card className="w-full">
        <CardHeader className="space-y-4">
          <div className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-left">Historial de Estimaciones</CardTitle>
            {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={handleExport} disabled={filteredEstimaciones.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Exportar a Excel
            </Button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar por número de estimación"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
                Todas
              </Button>
              <Button type="button" size="sm" variant={filter === 'paid' ? 'default' : 'outline'} onClick={() => setFilter('paid')}>
                Pagadas
              </Button>
              <Button type="button" size="sm" variant={filter === 'unpaid' ? 'default' : 'outline'} onClick={() => setFilter('unpaid')}>
                No Pagadas
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed min-w-[1400px]">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-1.5 px-1 font-medium whitespace-nowrap w-[7%]">N° Estimación</th>
                  <th className="py-1.5 px-1 font-medium whitespace-nowrap w-[10%]">Período</th>
                  <th className="py-1.5 px-1 font-medium text-right whitespace-nowrap w-[8%]">Monto (L)</th>
                  <th className="py-1.5 px-1 font-medium text-right whitespace-nowrap w-[10%]">Cláusulas Esc. (L)</th>
                  <th className="py-1.5 px-1 font-medium text-right whitespace-nowrap w-[11%]">Admin. Deleg. (L)</th>
                  <th className="py-1.5 px-1 font-medium text-right whitespace-nowrap w-[9%]">Monto Bruto</th>
                  <th className="py-1.5 px-1 font-medium text-right whitespace-nowrap w-[8%]">Ded. Anticipo</th>
                  <th className="py-1.5 px-1 font-medium text-right whitespace-nowrap w-[8%]">Ded. Calidad</th>
                  <th className="py-1.5 px-1 font-medium text-right whitespace-nowrap w-[9%]">Mat. Almacenados</th>
                  <th className="py-1.5 px-1 font-medium text-right whitespace-nowrap w-[9%]">Dev. Mat. Alm.</th>
                  <th className="py-1.5 px-1 font-medium text-right whitespace-nowrap w-[8%]">Monto Neto</th>
                  <th className="py-1.5 px-1 font-medium whitespace-nowrap w-[7%]">Estatus</th>
                  <th className="py-1.5 px-1 font-medium text-right whitespace-nowrap w-[6%]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEstimaciones.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-4 text-center text-muted-foreground">
                      Sin estimaciones registradas.
                    </td>
                  </tr>
                ) : (
                  filteredEstimaciones.map((e) => (
                    <tr key={e.id} className="border-b border-border/50">
                      <td className="py-1.5 px-1">{e.numero}</td>
                      <td className="py-1.5 px-1 whitespace-nowrap">
                        {formatCompactDate(e.fechaInicio)} - {formatCompactDate(e.fechaFin)}
                      </td>
                      <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(Number(e.monto) || 0)}</td>
                      <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(Number(e.escalatorias) || 0)}</td>
                      <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(Number(e.adminDelegada) || 0)}</td>
                      <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(Number(e.montoBruto) || 0)}</td>
                      <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(Number(e.deduccionAnticipo) || 0)}</td>
                      <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(Number(e.deduccionCalidad) || 0)}</td>
                      <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(Number(e.materialesAlmacenados) || 0)}</td>
                      <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(Number(e.devolucionMaterialesAlmacenados) || 0)}</td>
                      <td className="py-1.5 px-1 text-right font-medium whitespace-nowrap">L {fmt(Number(e.montoNeto) || 0)}</td>
                      <td className="py-1.5 px-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={readOnly || saving}
                          onClick={() => togglePagado(e.id)}
                          className={
                            e.pagado
                              ? 'border-transparent bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'border-transparent bg-orange-500 text-white hover:bg-orange-600'
                          }
                        >
                          {e.pagado ? 'Pagado' : 'No Pagado'}
                        </Button>
                      </td>
                      <td className="py-1.5 px-1 text-right whitespace-nowrap">
                        {!readOnly && (
                          <>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(e)} title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setToDelete(e)} title="Eliminar">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-medium">
                  <td className="py-1.5 px-1" colSpan={2}>Totales</td>
                  <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(totals.monto)}</td>
                  <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(totals.escalatorias)}</td>
                  <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(totals.adminDelegada)}</td>
                  <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(totals.bruto)}</td>
                  <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(totals.anticipo)}</td>
                  <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(totals.calidad)}</td>
                  <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(totals.materiales)}</td>
                  <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(totals.devolucionMateriales)}</td>
                  <td className="py-1.5 px-1 text-right whitespace-nowrap">L {fmt(totals.neto)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>
            <DialogTitle>Editar Estimación</DialogTitle>
          </DialogHeader>
          {editing && (
            <EstimacionFields
              key={editing.id}
              initial={draftFrom(editing)}
              idPrefix="est-edit"
              saving={saving}
              submitLabel="Guardar"
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar estimación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la estimación {toDelete?.numero} y se recalcularán los totales. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EstimacionesSection;
