import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Receipt, Plus, Trash2, Pencil, FileSpreadsheet } from "lucide-react";
import { exportRowsToExcel } from "@/utils/tableExport";
import { InlineField } from "@/components/ui/inline-field";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Gasto, Subcontrato, TipoGasto, SubcategoriaCostoDirecto } from "@/types/project";
import { useToast } from "@/hooks/use-toast";
import { gastoInputSchema, firstIssue, sanitizeAmount, sanitizeText } from "@/utils/dataValidation";
import { devError, toFriendlyMessage, FRIENDLY_ERRORS } from "@/utils/secureLogger";


interface Props {
  gastos: Gasto[];
  subcontratos: Subcontrato[];
  onChange: (next: Gasto[]) => void;
  /** When provided, changes are persisted to the database immediately. */
  onAutoSave?: (next: Gasto[]) => Promise<void>;
  readOnly?: boolean;
}

const TIPO_OPTIONS: TipoGasto[] = [
  'Costo Indirecto de Obra',
  'Fianzas',
  'Seguros',
  'Administración',
  'Escalatorias',
  'Imprevistos',
  'Financieros',
  'Costo Directo',
];

const SUBCATEGORIAS: SubcategoriaCostoDirecto[] = ['Abono a contrato', 'Materiales', 'Planilla', 'Anticipos'];

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Draft {
  fecha: string;
  descripcion: string;
  montoPagado: number;
  subcontratistaId: string;
  tipoGasto: TipoGasto | '';
  subcategoriaCostoDirecto?: SubcategoriaCostoDirecto;
}

const emptyDraft = (): Draft => ({
  fecha: new Date().toISOString().slice(0, 10),
  descripcion: '',
  montoPagado: 0,
  subcontratistaId: '',
  tipoGasto: '',
  subcategoriaCostoDirecto: undefined,
});

const draftFromGasto = (g: Gasto): Draft => ({
  fecha: g.fecha,
  descripcion: g.descripcion,
  montoPagado: Number(g.montoPagado) || 0,
  subcontratistaId: g.subcontratistaId,
  tipoGasto: g.tipoGasto,
  subcategoriaCostoDirecto: g.subcategoriaCostoDirecto,
});

const isValid = (d: Draft) =>
  !!d.fecha &&
  !!d.subcontratistaId &&
  !!d.tipoGasto &&
  (d.tipoGasto !== 'Costo Directo' || !!d.subcategoriaCostoDirecto) &&
  d.montoPagado > 0;

/**
 * Draft form fields. Keeps its own local state so keystrokes never re-render the
 * expense history table nor trigger the parent's heavy cost recalculations.
 */
interface GastoFieldsProps {
  initial: Draft;
  subs: Subcontrato[];
  idPrefix: string;
  saving: boolean;
  submitLabel: string;
  submitIcon?: React.ReactNode;
  onSubmit: (d: Draft) => Promise<boolean>;
  onCancel?: () => void;
  /** Bumped by the parent to reset fields (e.g. after a successful save). */
  resetKey?: number;
}

const GastoFields = React.memo(
  ({ initial, subs, idPrefix, saving, submitLabel, submitIcon, onSubmit, onCancel }: GastoFieldsProps) => {
    const [d, setD] = useState<Draft>(initial);
    const valid = isValid(d);

    const handleSubmit = async () => {
      if (!valid || saving) return;
      const ok = await onSubmit(d);
      if (ok && !onCancel) setD(emptyDraft());
    };

    return (
      <>
        <InlineField label="Fecha" htmlFor={`${idPrefix}-fecha`} leftAligned>
          <Input
            id={`${idPrefix}-fecha`}
            type="date"
            value={d.fecha}
            onChange={(e) => setD((s) => ({ ...s, fecha: e.target.value }))}
          />
        </InlineField>
        <InlineField label="Descripción" htmlFor={`${idPrefix}-desc`} leftAligned>
          <Input
            id={`${idPrefix}-desc`}
            value={d.descripcion}
            onChange={(e) => setD((s) => ({ ...s, descripcion: e.target.value }))}
            placeholder="ej. Compra de cemento"
          />
        </InlineField>
        <InlineField label="Monto Pagado (L)" htmlFor={`${idPrefix}-monto`} leftAligned>
          <CurrencyInput
            id={`${idPrefix}-monto`}
            value={d.montoPagado}
            onChange={(v) => setD((s) => ({ ...s, montoPagado: v }))}
          />
        </InlineField>
        <InlineField label="Subcontratista" leftAligned>
          <Select
            value={d.subcontratistaId || undefined}
            onValueChange={(v) => setD((s) => ({ ...s, subcontratistaId: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={subs.length ? 'Seleccione subcontratista' : 'Cree un subcontratista primero'} />
            </SelectTrigger>
            <SelectContent className="bg-card z-50">
              {subs.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </InlineField>
        <InlineField label="Tipo de Gasto" leftAligned>
          <Select
            value={d.tipoGasto || undefined}
            onValueChange={(v) =>
              setD((s) => ({
                ...s,
                tipoGasto: v as TipoGasto,
                subcategoriaCostoDirecto: v === 'Costo Directo' ? s.subcategoriaCostoDirecto : undefined,
              }))
            }
            disabled={!d.subcontratistaId}
          >
            <SelectTrigger>
              <SelectValue placeholder={d.subcontratistaId ? 'Seleccione tipo' : 'Primero elija subcontratista'} />
            </SelectTrigger>
            <SelectContent className="bg-card z-50">
              {TIPO_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </InlineField>
        {d.tipoGasto === 'Costo Directo' && (
          <InlineField label="Subcategoría" leftAligned>
            <Select
              value={d.subcategoriaCostoDirecto || undefined}
              onValueChange={(v) => setD((s) => ({ ...s, subcategoriaCostoDirecto: v as SubcategoriaCostoDirecto }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione subcategoría" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                {SUBCATEGORIAS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </InlineField>
        )}
        <div className={onCancel ? "flex justify-end gap-2" : "flex justify-end gap-2"}>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          )}
          <Button type="button" onClick={handleSubmit} disabled={!valid || saving}>
            {submitIcon}
            {saving ? 'Guardando...' : submitLabel}
          </Button>
        </div>
      </>
    );
  },
);
GastoFields.displayName = 'GastoFields';

interface HistoryProps {
  list: Gasto[];
  subs: Subcontrato[];
  readOnly: boolean;
  onEdit: (g: Gasto) => void;
  onRemove: (id: string) => void;
}

const GastosHistory = React.memo(({ list, subs, readOnly, onEdit, onRemove }: HistoryProps) => {
  const subNames = useMemo(() => {
    const m = new Map<string, string>();
    subs.forEach((s) => m.set(s.id, s.nombre));
    return m;
  }, [subs]);

  const rows = useMemo(() => [...list].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)), [list]);
  const total = useMemo(() => list.reduce((s, g) => s + (Number(g.montoPagado) || 0), 0), [list]);

  const handleExport = useCallback(() => {
    exportRowsToExcel(
      rows.map((g) => ({
        Fecha: g.fecha || '',
        'Descripción': g.descripcion || '',
        Subcontratista: subNames.get(g.subcontratistaId) || '',
        Tipo: g.tipoGasto || '',
        'Subcategoría': g.subcategoriaCostoDirecto || '',
        'Monto (L)': Number(g.montoPagado) || 0,
      })),
      'Historial de Gastos',
      'historial-gastos',
    );
  }, [rows, subNames]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-left">Historial de Gastos</CardTitle>
        {!readOnly && (
        <Button type="button" variant="outline" size="sm" onClick={handleExport} disabled={rows.length === 0}>
          <FileSpreadsheet className="h-4 w-4 mr-1" /> Exportar a Excel
        </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 px-2 font-medium">Fecha</th>
                <th className="py-2 px-2 font-medium">Descripción</th>
                <th className="py-2 px-2 font-medium">Subcontratista</th>
                <th className="py-2 px-2 font-medium">Tipo</th>
                <th className="py-2 px-2 font-medium">Subcategoría</th>
                <th className="py-2 px-2 font-medium text-right">Monto (L)</th>
                <th className="py-2 px-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-muted-foreground">
                    Sin gastos registrados.
                  </td>
                </tr>
              ) : (
                rows.map((g) => (
                  <tr key={g.id} className="border-b border-border/50">
                    <td className="py-2 px-2">{g.fecha}</td>
                    <td className="py-2 px-2">{g.descripcion || '—'}</td>
                    <td className="py-2 px-2">{subNames.get(g.subcontratistaId) || '—'}</td>
                    <td className="py-2 px-2">{g.tipoGasto}</td>
                    <td className="py-2 px-2">{g.subcategoriaCostoDirecto || '—'}</td>
                    <td className="py-2 px-2 text-right">L {fmt(Number(g.montoPagado) || 0)}</td>
                    <td className="py-2 px-2 text-right whitespace-nowrap">
                      {!readOnly && (
                        <>
                          <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(g)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(g.id)} title="Eliminar">
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
                <td className="py-2 px-2" colSpan={5}>Total</td>
                <td className="py-2 px-2 text-right">L {fmt(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});
GastosHistory.displayName = 'GastosHistory';

const RegistroGastosSection: React.FC<Props> = ({ gastos, subcontratos, onChange, onAutoSave, readOnly = false }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Gasto | null>(null);
  // Remount key for the "new expense" form after a successful save.
  const [formKey, setFormKey] = useState(0);

  const list = gastos || [];
  const subs = subcontratos || [];

  // Keep the latest list in a ref so callbacks stay stable across renders.
  const listRef = useRef(list);
  listRef.current = list;

  const commit = useCallback(
    async (next: Gasto[]) => {
      onChange(next);
      if (!onAutoSave) return true;
      setSaving(true);
      try {
        await onAutoSave(next);
        return true;
      } catch (e) {
        devError('guardar gasto', e);
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
      const parsed = gastoInputSchema.safeParse({
        fecha: d.fecha,
        descripcion: sanitizeText(d.descripcion, 300),
        montoPagado: sanitizeAmount(d.montoPagado),
        subcontratistaId: d.subcontratistaId,
        tipoGasto: d.tipoGasto,
        subcategoriaCostoDirecto: d.subcategoriaCostoDirecto,
      });
      if (!parsed.success) {
        toast({
          title: 'Datos inválidos',
          description: firstIssue(parsed) ?? FRIENDLY_ERRORS.validation,
          variant: 'destructive',
        });
        return null;
      }
      if (parsed.data.tipoGasto === 'Costo Directo' && !parsed.data.subcategoriaCostoDirecto) {
        toast({ title: 'Datos inválidos', description: 'Seleccione la subcategoría de Costo Directo.', variant: 'destructive' });
        return null;
      }
      return {
        ...d,
        fecha: parsed.data.fecha,
        descripcion: parsed.data.descripcion,
        montoPagado: parsed.data.montoPagado,
        subcontratistaId: parsed.data.subcontratistaId,
      };
    },
    [toast],
  );

  const handleCreate = useCallback(
    async (d: Draft) => {
      const clean = validateDraft(d);
      if (!clean) return false;
      const newGasto: Gasto = {
        id: crypto.randomUUID(),
        fecha: clean.fecha,
        descripcion: clean.descripcion,
        montoPagado: clean.montoPagado,
        subcontratistaId: clean.subcontratistaId,
        tipoGasto: clean.tipoGasto as TipoGasto,
        subcategoriaCostoDirecto: clean.tipoGasto === 'Costo Directo' ? clean.subcategoriaCostoDirecto : undefined,
      };
      const ok = await commit([...listRef.current, newGasto]);
      if (ok) {
        setFormKey((n) => n + 1);
        toast({ title: 'Gasto registrado', description: 'El gasto se guardó correctamente.' });
      }
      return ok;
    },
    [commit, toast, validateDraft],
  );

  const handleUpdate = useCallback(
    async (d: Draft) => {
      if (!editing) return false;
      const clean = validateDraft(d);
      if (!clean) return false;
      const ok = await commit(
        listRef.current.map((g) =>
          g.id === editing.id
            ? {
                ...g,
                fecha: clean.fecha,
                descripcion: clean.descripcion,
                montoPagado: clean.montoPagado,
                subcontratistaId: clean.subcontratistaId,
                tipoGasto: clean.tipoGasto as TipoGasto,
                subcategoriaCostoDirecto:
                  clean.tipoGasto === 'Costo Directo' ? clean.subcategoriaCostoDirecto : undefined,
              }
            : g,
        ),
      );
      if (ok) setEditing(null);
      return ok;
    },
    [commit, editing, validateDraft],
  );


  const handleRemove = useCallback(
    (id: string) => {
      commit(listRef.current.filter((g) => g.id !== id));
    },
    [commit],
  );

  const handleEdit = useCallback((g: Gasto) => setEditing(g), []);
  const closeEdit = useCallback(() => setEditing(null), []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialDraft = useMemo(() => emptyDraft(), [formKey]);

  return (
    <div className="space-y-6 text-left">
      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <Receipt className="h-5 w-5" /> Registrar Egreso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GastoFields
              key={formKey}
              initial={initialDraft}
              subs={subs}
              idPrefix="g"
              saving={saving}
              submitLabel="Registrar Gasto"
              submitIcon={<Plus className="h-4 w-4 mr-1" />}
              onSubmit={handleCreate}
            />
          </CardContent>
        </Card>
      )}

      <GastosHistory
        list={list}
        subs={subs}
        readOnly={readOnly}
        onEdit={handleEdit}
        onRemove={handleRemove}
      />

      <Dialog open={!!editing} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Gasto</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <GastoFields
                key={editing.id}
                initial={draftFromGasto(editing)}
                subs={subs}
                idPrefix="ge"
                saving={saving}
                submitLabel="Guardar"
                onSubmit={handleUpdate}
                onCancel={closeEdit}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegistroGastosSection;
