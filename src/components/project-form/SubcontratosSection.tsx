import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Plus, Trash2, Pencil, Eye, FileSpreadsheet } from "lucide-react";
import { exportRowsToExcel } from "@/utils/tableExport";
import { InlineField } from "@/components/ui/inline-field";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Subcontrato, Gasto } from "@/types/project";
import SubcontratistaDetail from './SubcontratistaDetail';
import { sanitizeAmount, sanitizeText } from "@/utils/dataValidation";
import { devError } from "@/utils/secureLogger";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";


interface Props {
  subcontratos: Subcontrato[];
  gastos: Gasto[];
  onChange: (next: Subcontrato[]) => void;
  /** Persist immediately to the database. */
  onAutoSave?: (next: Subcontrato[]) => Promise<void>;
  readOnly?: boolean;
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SubcontratosSection: React.FC<Props> = ({ subcontratos, gastos, onChange, onAutoSave, readOnly = false }) => {
  const list = subcontratos || [];
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<{ nombre: string; descripcion: string; monto: number }>({
    nombre: '',
    descripcion: '',
    monto: 0,
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ nombre: string; descripcion: string; monto: number }>({
    nombre: '',
    descripcion: '',
    monto: 0,
  });

  useEffect(() => {
    if (editingId) {
      const s = list.find((x) => x.id === editingId);
      if (s) setEditDraft({ nombre: s.nombre, descripcion: s.descripcion, monto: Number(s.monto) || 0 });
    }
  }, [editingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pagadoPor = (id: string) =>
    (gastos || [])
      .filter((g) => g.subcontratistaId === id)
      .reduce((s, g) => s + (Number(g.montoPagado) || 0), 0);

  const commit = async (next: Subcontrato[]) => {
    onChange(next);
    if (!onAutoSave) return;
    setSaving(true);
    try {
      await onAutoSave(next);
    } catch (e) {
      devError('guardar subcontratista', e);
    } finally {
      setSaving(false);
    }
  };

  const addNew = async () => {
    const nombre = sanitizeText(draft.nombre, 120);
    if (!nombre || saving) return;
    const next = [
      ...list,
      {
        id: crypto.randomUUID(),
        nombre,
        descripcion: sanitizeText(draft.descripcion, 300),
        monto: sanitizeAmount(draft.monto),
      },
    ];
    setDraft({ nombre: '', descripcion: '', monto: 0 });
    await commit(next);
  };

  const remove = (id: string) => commit(list.filter((s) => s.id !== id));

  const saveEdit = async () => {
    if (!editingId) return;
    const nombre = sanitizeText(editDraft.nombre, 120);
    if (!nombre) return;
    const next = list.map((s) =>
      s.id === editingId
        ? {
            ...s,
            nombre,
            descripcion: sanitizeText(editDraft.descripcion, 300),
            monto: sanitizeAmount(editDraft.monto),
          }
        : s,
    );
    setEditingId(null);
    await commit(next);
  };


  const totalContratado = list.reduce((s, x) => s + (Number(x.monto) || 0), 0);
  const totalPagado = (gastos || []).reduce((s, g) => s + (Number(g.montoPagado) || 0), 0);
  const detailSub = detailId ? list.find((s) => s.id === detailId) || null : null;

  return (
    <div className="space-y-6 text-left">
      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <Users className="h-5 w-5" /> Registrar Subcontratista
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InlineField label="Nombre de Subcontratista" htmlFor="sub-new-nombre" leftAligned>
              <Input
                id="sub-new-nombre"
                value={draft.nombre}
                onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                placeholder="ej. Construcciones XYZ S.A."
              />
            </InlineField>
            <InlineField label="Descripción" htmlFor="sub-new-desc" leftAligned>
              <Input
                id="sub-new-desc"
                value={draft.descripcion}
                onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))}
                placeholder="ej. Movimiento de tierra"
              />
            </InlineField>
            <InlineField label="Monto de Subcontrato (L)" htmlFor="sub-new-monto" leftAligned>
              <CurrencyInput
                id="sub-new-monto"
                value={draft.monto}
                onChange={(v) => setDraft((d) => ({ ...d, monto: v }))}
              />
            </InlineField>
            <div className="flex justify-end">
              <Button type="button" onClick={addNew} disabled={!draft.nombre.trim() || saving}>
                <Plus className="h-4 w-4 mr-1" /> {saving ? 'Guardando...' : 'Agregar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-left">Subcontratistas Registrados</CardTitle>
          {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={list.length === 0}
            onClick={() =>
              exportRowsToExcel(
                list.map((s) => {
                  const pagado = pagadoPor(s.id);
                  return {
                    Nombre: s.nombre || '',
                    'Descripción': s.descripcion || '',
                    'Monto Subcontrato (L)': Number(s.monto) || 0,
                    'Monto Pagado (L)': pagado,
                    'Monto Adeudado (L)': (Number(s.monto) || 0) - pagado,
                  };
                }),
                'Subcontratos',
                'historial-subcontratos',
              )
            }
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Exportar a Excel
          </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 px-2 font-medium">Nombre</th>
                  <th className="py-2 px-2 font-medium">Descripción</th>
                  <th className="py-2 px-2 font-medium text-right">Monto Subcontrato (L)</th>
                  <th className="py-2 px-2 font-medium text-right">Monto Pagado (L)</th>
                  <th className="py-2 px-2 font-medium text-right">Monto Adeudado (L)</th>
                  <th className="py-2 px-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-muted-foreground">
                      Sin subcontratistas registrados.
                    </td>
                  </tr>
                ) : (
                  list.map((s) => {
                    const pagado = pagadoPor(s.id);
                    const adeudado = (Number(s.monto) || 0) - pagado;
                    return (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-2 px-2 font-medium">{s.nombre}</td>
                        <td className="py-2 px-2 text-muted-foreground">{s.descripcion}</td>
                        <td className="py-2 px-2 text-right">L {fmt(Number(s.monto) || 0)}</td>
                        <td className="py-2 px-2 text-right">L {fmt(pagado)}</td>
                        <td className={`py-2 px-2 text-right font-medium ${adeudado < 0 ? 'text-destructive' : ''}`}>
                          L {fmt(adeudado)}
                        </td>
                        <td className="py-2 px-2 text-right whitespace-nowrap">
                          <div className="flex justify-end items-center gap-1">
                            {!readOnly && (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingId(s.id)}
                                  title="Editar"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => remove(s.id)}
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDetailId(s.id)}
                              title="Ver Detalles"
                            >
                              <Eye className="h-4 w-4 mr-1" /> Ver Detalles
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-medium">
                  <td className="py-2 px-2" colSpan={2}>Totales</td>
                  <td className="py-2 px-2 text-right">L {fmt(totalContratado)}</td>
                  <td className="py-2 px-2 text-right">L {fmt(totalPagado)}</td>
                  <td className="py-2 px-2 text-right">L {fmt(totalContratado - totalPagado)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <SubcontratistaDetail
        subcontratista={detailSub}
        gastos={gastos || []}
        onClose={() => setDetailId(null)}
      />

      <Dialog open={!!editingId} onOpenChange={(o) => !o && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Subcontratista</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <InlineField label="Nombre" htmlFor="sub-edit-nombre" leftAligned>
              <Input
                id="sub-edit-nombre"
                value={editDraft.nombre}
                onChange={(e) => setEditDraft((d) => ({ ...d, nombre: e.target.value }))}
              />
            </InlineField>
            <InlineField label="Descripción" htmlFor="sub-edit-desc" leftAligned>
              <Input
                id="sub-edit-desc"
                value={editDraft.descripcion}
                onChange={(e) => setEditDraft((d) => ({ ...d, descripcion: e.target.value }))}
              />
            </InlineField>
            <InlineField label="Monto (L)" htmlFor="sub-edit-monto" leftAligned>
              <CurrencyInput
                id="sub-edit-monto"
                value={editDraft.monto}
                onChange={(v) => setEditDraft((d) => ({ ...d, monto: v }))}
              />
            </InlineField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
            <Button type="button" onClick={saveEdit} disabled={!editDraft.nombre.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubcontratosSection;
