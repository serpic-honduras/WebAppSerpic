import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineField } from "@/components/ui/inline-field";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useToast } from "@/hooks/use-toast";
import { Garantia } from "@/types/project";
import { fmtL } from "@/utils/budgetModifications";
import { fetchGarantias, upsertGarantia, deleteGarantia } from '@/api/garantiasApi';
import { ShieldCheck, Pencil, Trash2 } from "lucide-react";

interface Props {
  projectId?: string;
  garantias: Garantia[];
  onChange: (next: Garantia[]) => void;
  readOnly?: boolean;
}

type Draft = {
  id: string | null;
  numero: string;
  vigenciaInicio: string;
  vigenciaFin: string;
  monto: number;
};

const emptyDraft = (): Draft => ({
  id: null,
  numero: '',
  vigenciaInicio: '',
  vigenciaFin: '',
  monto: 0,
});

const GarantiasSection: React.FC<Props> = ({ projectId, garantias, onChange, readOnly = false }) => {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load the persisted rows so the history always reflects the database.
  useEffect(() => {
    if (!projectId || projectId === 'new' || readOnly) return;
    let cancelled = false;
    fetchGarantias(projectId)
      .then((rows) => {
        if (!cancelled) onChange(rows);
      })
      .catch(() => {
        if (!cancelled) {
          toast({
            title: "Error",
            description: "No se pudieron cargar las garantías.",
            variant: "destructive",
          });
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, readOnly]);

  const total = useMemo(
    () => (garantias || []).reduce((s, g) => s + (Number(g.monto) || 0), 0),
    [garantias],
  );

  const canSave = !readOnly && !saving && draft.numero.trim() !== '' && (Number(draft.monto) || 0) > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const entry: Garantia = {
        id: draft.id || crypto.randomUUID(),
        numero: draft.numero.trim(),
        vigenciaInicio: draft.vigenciaInicio,
        vigenciaFin: draft.vigenciaFin,
        monto: Number(draft.monto) || 0,
      };

      if (projectId && projectId !== 'new') {
        // Persist directly in the database, then refresh the history with the saved row.
        const saved = await upsertGarantia(projectId, entry);
        const next = draft.id
          ? (garantias || []).map((g) => (g.id === draft.id ? saved : g))
          : [...(garantias || []), saved];
        onChange(next);
        toast({ title: "Garantía registrada correctamente" });
      } else {
        // New project not yet saved: keep it in the form state until creation.
        const next = draft.id
          ? (garantias || []).map((g) => (g.id === draft.id ? entry : g))
          : [...(garantias || []), entry];
        onChange(next);
        toast({ title: "Garantía agregada. Se guardará con el proyecto." });
      }

      setDraft(emptyDraft());
    } catch {
      toast({
        title: "Error",
        description: "No se pudo guardar la garantía. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (g: Garantia) => {
    setDraft({
      id: g.id,
      numero: g.numero,
      vigenciaInicio: g.vigenciaInicio || '',
      vigenciaFin: g.vigenciaFin || '',
      monto: Number(g.monto) || 0,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      if (projectId && projectId !== 'new') {
        await deleteGarantia(id);
      }
      onChange((garantias || []).filter((g) => g.id !== id));
      if (draft.id === id) setDraft(emptyDraft());
      toast({ title: "Garantía eliminada" });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo eliminar la garantía.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!readOnly && (
        <Card className="border-border">
          <CardHeader className="bg-muted text-left">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {draft.id ? 'Editar Garantía' : 'Registrar Garantía'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <InlineField label="Garantía No." htmlFor="gar-numero" leftAligned>
              <Input
                id="gar-numero"
                value={draft.numero}
                placeholder="Garantía 1"
                onChange={(e) => setDraft((d) => ({ ...d, numero: e.target.value }))}
              />
            </InlineField>
            <InlineField label="Vigencia Inicio" htmlFor="gar-inicio" leftAligned>
              <Input
                id="gar-inicio"
                type="date"
                value={draft.vigenciaInicio}
                onChange={(e) => setDraft((d) => ({ ...d, vigenciaInicio: e.target.value }))}
              />
            </InlineField>
            <InlineField label="Fecha de vencimiento" htmlFor="gar-fin" leftAligned>
              <Input
                id="gar-fin"
                type="date"
                value={draft.vigenciaFin}
                onChange={(e) => setDraft((d) => ({ ...d, vigenciaFin: e.target.value }))}
              />
            </InlineField>
            <InlineField label="Monto (L)" htmlFor="gar-monto" leftAligned>
              <CurrencyInput
                id="gar-monto"
                value={draft.monto}
                onChange={(v) => setDraft((d) => ({ ...d, monto: v }))}
              />
            </InlineField>

            <div className="flex gap-3">
              <Button type="button" onClick={handleSave} disabled={!canSave}>
                {saving ? 'Guardando...' : draft.id ? 'Actualizar Garantía' : 'Agregar Garantía'}
              </Button>
              {draft.id && (
                <Button type="button" variant="outline" onClick={() => setDraft(emptyDraft())} disabled={saving}>
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border">
        <CardHeader className="bg-muted text-left">
          <CardTitle className="text-foreground">Historial de Garantías</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(garantias || []).length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No hay garantías registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="text-left px-4 py-2 font-semibold">Garantía No.</th>
                    <th className="text-left px-4 py-2 font-semibold">Fecha Inicio</th>
                    <th className="text-left px-4 py-2 font-semibold">Fecha de vencimiento</th>
                    <th className="text-right px-4 py-2 font-semibold">Monto (L)</th>
                    {!readOnly && <th className="text-right px-4 py-2 font-semibold">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {(garantias || []).map((g) => (
                    <tr key={g.id} className="border-b border-border">
                      <td className="px-4 py-2">{g.numero}</td>
                      <td className="px-4 py-2">{g.vigenciaInicio || '—'}</td>
                      <td className="px-4 py-2">{g.vigenciaFin || '—'}</td>
                      <td className="px-4 py-2 text-right">{fmtL(g.monto)}</td>
                      {!readOnly && (
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          <Button type="button" size="sm" variant="ghost" onClick={() => handleEdit(g)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDelete(g.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className="bg-muted font-bold">
                    <td className="px-4 py-2" colSpan={3}>Total</td>
                    <td className="px-4 py-2 text-right">{fmtL(total)}</td>
                    {!readOnly && <td />}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GarantiasSection;
