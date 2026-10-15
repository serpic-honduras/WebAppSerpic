import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InlineField } from "@/components/ui/inline-field";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Anticipo, Estimacion } from "@/types/project";
import { useToast } from "@/hooks/use-toast";
import { anticipoSchema, firstIssue, sanitizeAmount } from "@/utils/dataValidation";
import { devError, toFriendlyMessage, FRIENDLY_ERRORS } from "@/utils/secureLogger";
import { Wallet, Pencil, TrendingDown, PiggyBank } from "lucide-react";


interface Props {
  anticipo: Anticipo | null;
  estimaciones: Estimacion[];
  onChange: (next: Anticipo | null) => void;
  onAutoSave?: (next: Anticipo | null) => Promise<void>;
  readOnly?: boolean;
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const AnticiposSection: React.FC<Props> = ({ anticipo, estimaciones, onChange, onAutoSave, readOnly = false }) => {
  const { toast } = useToast();
  const [editing, setEditing] = useState(!anticipo);
  const [saving, setSaving] = useState(false);
  const [monto, setMonto] = useState<number>(anticipo?.monto ?? 0);
  const [fecha, setFecha] = useState<string>(anticipo?.fecha ?? '');

  const retenido = useMemo(
    () => (estimaciones || []).reduce((s, e) => s + (Number(e.deduccionAnticipo) || 0), 0),
    [estimaciones],
  );
  const restante = (anticipo?.monto ?? 0) - retenido;

  const handleSave = async () => {
    const parsed = anticipoSchema.safeParse({ monto: sanitizeAmount(monto), fecha });
    if (!parsed.success) {
      toast({
        title: 'Datos inválidos',
        description: firstIssue(parsed) ?? FRIENDLY_ERRORS.validation,
        variant: 'destructive',
      });
      return;
    }
    const next: Anticipo = { monto: parsed.data.monto, fecha: parsed.data.fecha };

    onChange(next);
    if (onAutoSave) {
      setSaving(true);
      try {
        await onAutoSave(next);
      } catch (e) {
        devError('guardar anticipo', e);
        toast({ title: 'Error', description: toFriendlyMessage(e, 'save'), variant: 'destructive' });
        setSaving(false);
        return;
      } finally {
        setSaving(false);
      }
    }
    setEditing(false);
  };


  return (
    <div className="space-y-4">
      {(!anticipo || editing) && !readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-left flex items-center gap-2">
              <Wallet className="h-5 w-5" /> {anticipo ? 'Editar Anticipo' : 'Registrar Anticipo'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InlineField label="Monto de Anticipo (L)" htmlFor="anticipo-monto" leftAligned>
              <CurrencyInput id="anticipo-monto" value={monto} onChange={setMonto} />
            </InlineField>
            <InlineField label="Fecha de Anticipo" htmlFor="anticipo-fecha" leftAligned>
              <Input id="anticipo-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </InlineField>
            <div className="flex justify-end gap-2">
              {anticipo && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMonto(anticipo.monto);
                    setFecha(anticipo.fecha);
                    setEditing(false);
                  }}
                >
                  Cancelar
                </Button>
              )}
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Anticipo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {anticipo && !editing && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Monto de Anticipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">L {fmt(anticipo.monto)}</div>
              <p className="text-xs text-muted-foreground mt-1">Fecha: {anticipo.fecha || '—'}</p>
              {!readOnly && (
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" /> Editar
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" /> Anticipo Retenido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">L {fmt(retenido)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Suma de deducciones en {(estimaciones || []).length} estimación(es)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PiggyBank className="h-4 w-4" /> Anticipo Restante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${restante < 0 ? 'text-destructive' : ''}`}>L {fmt(restante)}</div>
              <p className="text-xs text-muted-foreground mt-1">Monto de anticipo menos retenciones</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!anticipo && readOnly && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">Sin anticipo registrado.</CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnticiposSection;
