import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User, CheckCircle2, FileSpreadsheet, Upload, Loader2 } from "lucide-react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { Button } from "@/components/ui/button";
import { exportProjectDossier } from "@/utils/projectDossierExport";
import { parseProjectDossier, DossierImportError } from "@/utils/projectDossierImport";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSecureProjects } from "@/hooks/useSecureProjects";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InlineField } from "@/components/ui/inline-field";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIPO_PROYECTO_OPTIONS = [
  'Paso de Vehículos',
  'Puente de Concreto',
  'Caja de Concreto',
  'Pavimentación con Concreto Hidráulico',
  'Construcción de Edificios',
  'Mitigación de Riesgos',
  'Consultorías de Supervisión y Diseño',
  'Obras Eléctricas e Hidráulicas',
];

interface BasicInformationSectionProps {
  formData: any;
  onInputChange: (field: string, value: any) => void;
  disabled?: boolean;
}

const formatUsd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
    .format(Number(v) || 0);

const BasicInformationSection = ({ formData, onInputChange, disabled = false }: BasicInformationSectionProps) => {
  const { isAuditor, isAdmin, can } = useSecureAuth();
  const canDelete = !isAuditor && (isAdmin || can('projects.delete')) && !!formData.id;
  const { deleteProject } = useSecureProjects();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    await deleteProject(formData.id);
    setDeleting(false);
    setConfirmOpen(false);
    navigate('/');
  };
  const finalAmountUsd =
    (Number(formData.finalAmountHnl) || 0) * (Number(formData.projectExchangeRate) || 0);

  const d = disabled;
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [importing, setImporting] = React.useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const patch = await parseProjectDossier(file, formData);
      Object.entries(patch).forEach(([k, v]) => onInputChange(k, v));
      toast.success('Expediente importado exitosamente', {
        description: 'Revise los datos y presione "Guardar" para confirmar los cambios.',
      });
    } catch (err) {
      toast.error('Error al importar el expediente', {
        description: err instanceof DossierImportError ? err.message : 'No se pudo procesar el archivo.',
      });
    } finally {
      setImporting(false);
    }
  };


  return (
    <div className="space-y-6 text-left">
      {/* A) Generales */}
      <Card className="text-left">
        <CardHeader className="text-left">
          <CardTitle className="flex items-center gap-2 text-left">
            <Building2 className="h-5 w-5" /> Generales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          <InlineField label="Nombre del Proyecto" htmlFor="name" leftAligned>
            <Input disabled={d} id="name" value={formData.name || ''} onChange={(e) => onInputChange('name', e.target.value)} placeholder="ej. Construcción Edificio Central" />
          </InlineField>
          <InlineField label="Número de Contrato" htmlFor="contractNumber" leftAligned>
            <Input disabled={d} id="contractNumber" value={formData.contractNumber || ''} onChange={(e) => onInputChange('contractNumber', e.target.value)} placeholder="ej. CTR-2025-001" />
          </InlineField>
          <InlineField label="Ubicación" htmlFor="location" leftAligned>
            <Input disabled={d} id="location" value={formData.location || ''} onChange={(e) => onInputChange('location', e.target.value)} placeholder="ej. Tegucigalpa, Honduras" />
          </InlineField>
          <InlineField label="Consorcio" htmlFor="consortium" leftAligned>
            <Input disabled={d} id="consortium" value={formData.consortium || ''} onChange={(e) => onInputChange('consortium', e.target.value)} placeholder="ej. Consorcio ABC-XYZ" />
          </InlineField>
          <InlineField label="Residente" htmlFor="residentName" leftAligned>
            <Input disabled={d} id="residentName" value={formData.residentName || ''} onChange={(e) => onInputChange('residentName', e.target.value)} placeholder="ej. Ing. María López" />
          </InlineField>
          <InlineField label="Tipo de Proyecto" htmlFor="workType" leftAligned>
            <Select
              disabled={d}
              value={formData.workType || undefined}
              onValueChange={(v) => onInputChange('workType', v)}
            >
              <SelectTrigger id="workType">
                <SelectValue placeholder="Seleccione tipo de proyecto" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                {TIPO_PROYECTO_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </InlineField>
          <InlineField label="Monto Inicial L" htmlFor="initialAmount" leftAligned>
            <CurrencyInput id="initialAmount" disabled={d} value={Number(formData.initialAmount) || 0} onChange={(v) => onInputChange('initialAmount', v)} />
          </InlineField>
          <InlineField label="Plazo Inicial (días)" htmlFor="initialTermDays" leftAligned>
            <Input disabled={d} id="initialTermDays" type="number" value={formData.initialTermDays ?? ''} onChange={(e) => onInputChange('initialTermDays', parseInt(e.target.value) || 0)} placeholder="0" />
          </InlineField>
          <InlineField label="Fecha Orden de Inicio" htmlFor="startOrderDate" leftAligned>
            <Input disabled={d} id="startOrderDate" type="date" value={formData.startOrderDate || ''} onChange={(e) => onInputChange('startOrderDate', e.target.value)} />
          </InlineField>
        </CardContent>
      </Card>

      {/* B) Información del Cliente */}
      <Card className="text-left">
        <CardHeader className="text-left">
          <CardTitle className="flex items-center gap-2 text-left">
            <User className="h-5 w-5" /> Información del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          <InlineField label="Nombre del Ente Contratante" htmlFor="client" leftAligned>
            <Input disabled={d} id="client" value={formData.client || ''} onChange={(e) => onInputChange('client', e.target.value)} placeholder="ej. Secretaría de Infraestructura" />
          </InlineField>
          <InlineField label="Teléfono del Cliente" htmlFor="clientPhone" leftAligned>
            <Input disabled={d} id="clientPhone" value={formData.clientContact?.phone || ''} onChange={(e) => onInputChange('clientContact.phone', e.target.value)} placeholder="ej. +504 2222-2222" />
          </InlineField>
          <InlineField label="Contacto" htmlFor="clientContactName" leftAligned>
            <Input disabled={d} id="clientContactName" value={formData.clientContact?.name || ''} onChange={(e) => onInputChange('clientContact.name', e.target.value)} placeholder="ej. Ing. Juan Pérez" />
          </InlineField>
          <InlineField label="Correo" htmlFor="clientEmail" leftAligned>
            <Input disabled={d} id="clientEmail" type="email" value={formData.clientContact?.email || ''} onChange={(e) => onInputChange('clientContact.email', e.target.value)} placeholder="ej. contacto@empresa.com" />
          </InlineField>
        </CardContent>
      </Card>

      {/* C) Cierre */}
      <Card className="text-left">
        <CardHeader className="text-left">
          <CardTitle className="flex items-center gap-2 text-left">
            <CheckCircle2 className="h-5 w-5" /> Cierre
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          <InlineField label="M² de Construcción" htmlFor="constructionM2" leftAligned>
            <Input disabled={d} id="constructionM2" type="number" step="0.01" value={formData.constructionM2 ?? ''} onChange={(e) => onInputChange('constructionM2', parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </InlineField>
          <InlineField label="Descripción de Actividades" htmlFor="activitiesDescription" align="start" leftAligned>
            <Textarea disabled={d} id="activitiesDescription" rows={4} value={formData.activitiesDescription || ''} onChange={(e) => onInputChange('activitiesDescription', e.target.value)} placeholder="Describa las principales actividades del proyecto..." />
          </InlineField>
          <InlineField label="Fecha de Recepción Final" htmlFor="finalReceptionDate" leftAligned>
            <Input disabled={d} id="finalReceptionDate" type="date" value={formData.finalReceptionDate || ''} onChange={(e) => onInputChange('finalReceptionDate', e.target.value)} />
          </InlineField>
          <InlineField label="Plazo Final (días)" htmlFor="finalTermDays" leftAligned>
            <Input disabled={d} id="finalTermDays" type="number" value={formData.finalTermDays ?? ''} onChange={(e) => onInputChange('finalTermDays', parseInt(e.target.value) || 0)} placeholder="0" />
          </InlineField>
          <InlineField label="Duración Final (meses)" htmlFor="finalDurationMonths" leftAligned>
            <Input disabled={d} id="finalDurationMonths" type="number" step="0.01" value={formData.finalDurationMonths ?? ''} onChange={(e) => onInputChange('finalDurationMonths', parseFloat(e.target.value) || 0)} placeholder="0" />
          </InlineField>
          <InlineField label="Año de Ejecución" htmlFor="executionYear" leftAligned>
            <Input disabled={d} id="executionYear" type="number" value={formData.executionYear ?? ''} onChange={(e) => onInputChange('executionYear', parseInt(e.target.value) || 0)} placeholder="2026" />
          </InlineField>
          <InlineField label="Monto Final L" htmlFor="finalAmountHnl" leftAligned>
            <CurrencyInput id="finalAmountHnl" disabled={d} value={Number(formData.finalAmountHnl) || 0} onChange={(v) => onInputChange('finalAmountHnl', v)} />
          </InlineField>
          <InlineField label="Tasa de Cambio del Proyecto" htmlFor="projectExchangeRate" leftAligned>
            <Input disabled={d} id="projectExchangeRate" type="number" step="0.0001" value={formData.projectExchangeRate ?? ''} onChange={(e) => onInputChange('projectExchangeRate', parseFloat(e.target.value) || 0)} placeholder="ej. 0.0405" />
          </InlineField>
          <InlineField label="Monto Final $" htmlFor="finalAmountUsd" leftAligned>
            <Input
              id="finalAmountUsd"
              type="text"
              value={formatUsd(finalAmountUsd)}
              disabled
              readOnly
              className="bg-muted cursor-not-allowed"
            />
          </InlineField>
          <p className="text-xs text-muted-foreground text-left pl-0 md:pl-[15rem]">
            Se calcula automáticamente: Monto Final L × Tasa de Cambio.
          </p>
          <InlineField label="Estado del Proyecto" htmlFor="status" leftAligned>
            <Select
              disabled={d}
              value={formData.status || 'Planning'}
              onValueChange={(v) => onInputChange('status', v)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Seleccione estado" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                <SelectItem value="Planning">En Planificación</SelectItem>
                <SelectItem value="In Progress">En Progreso</SelectItem>
                <SelectItem value="Completed">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </InlineField>

          {!isAuditor && (
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />
            {canDelete && (
              <Button type="button" variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirmOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Proyecto
              </Button>
            )}
            {!d && (
              <Button type="button" variant="outline" disabled={importing} onClick={() => fileRef.current?.click()}>
                {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Importar Expediente Completo (Excel)
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => exportProjectDossier(formData)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Expediente Completo (Excel)
            </Button>
          </div>
          )}
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El proyecto "{formData.name}" se eliminará permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => { e.preventDefault(); handleDelete(); }}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {importing && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <div className="flex items-center gap-3 rounded-lg border bg-card px-6 py-4 shadow-lg">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">Importando y procesando expediente...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicInformationSection;
