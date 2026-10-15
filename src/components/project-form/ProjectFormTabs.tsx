import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project, MonthlyExpense, Subcontrato, Gasto, Anticipo, Estimacion } from '@/types/project';
import { MonthlyEstimation } from '@/types/monthlyEstimation';
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";
import BasicInformationSection from './BasicInformationSection';
import CostoPresupuestadoSection from './CostoPresupuestadoSection';
import CostoDinamicoSection from './CostoDinamicoSection';
import CostoDiferencialSection from './CostoDiferencialSection';
import PhotosSection from './PhotosSection';
import SubcontratosSection from './SubcontratosSection';
import AnticiposSection from './AnticiposSection';
import GarantiasSection from './GarantiasSection';
import EstimacionesSection from './EstimacionesSection';
import RegistroGastosSection from './RegistroGastosSection';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { consolidatedCosto } from '@/utils/budgetModifications';

interface ProjectFormTabsProps {
  formData: Omit<Project, 'id'>;
  monthlyEstimations: MonthlyEstimation[];
  onInputChange: (field: string, value: any) => void;
  onMonthlyExpensesChange: (expenses: MonthlyExpense[]) => void;
  onEstimationsChange: (estimations: MonthlyEstimation[]) => void;
  /** Project id (or 'new') — used for tab persistence per project. */
  storageKey?: string;
  /** Incremented after a successful save so tabs auto-lock again. */
  savedSignal?: number;
  /** Persist immediately (used by the expense registry). */
  onAutoSave?: (overrides: Partial<Omit<Project, 'id'>>) => Promise<void>;
  /** Notifies the parent about the currently active tab. */
  onActiveTabChange?: (tab: string) => void;
  /** Controlled edit state for the "Costo Presupuestado" tab (button lives in the action bar). */
  presupuestadoEditing?: boolean;
  onPresupuestadoEditingChange?: (v: boolean) => void;
}

const EditToggle = ({ editing, onToggle }: { editing: boolean; onToggle: () => void }) => (
  <div className="flex justify-end mb-4">
    <Button
      type="button"
      size="sm"
      variant={editing ? "outline" : "default"}
      onClick={onToggle}
      className={editing ? "" : "bg-primary hover:bg-primary/90 text-primary-foreground"}
    >
      {editing ? (<><Lock className="h-4 w-4 mr-1" /> Bloquear Edición</>) : (<><Unlock className="h-4 w-4 mr-1" /> Editar</>)}
    </Button>
  </div>
);


const ProjectFormTabs = ({
  formData,
  onInputChange,
  storageKey = 'new',
  savedSignal = 0,
  onAutoSave,
  onActiveTabChange,
  presupuestadoEditing: presupuestadoEditingProp,
  onPresupuestadoEditingChange,
}: ProjectFormTabsProps) => {

  const { isAuditor, can } = useSecureAuth();
  const canEditProject = !isAuditor && can('projects.edit');
  const canEditCosts = !isAuditor && can('costs.edit');
  const canEditEstimations = !isAuditor && can('estimations.edit');
  const canEditSubcontracts = !isAuditor && can('subcontracts.edit');
  const canEditExpenses = !isAuditor && can('expenses.edit');

  const initialAmount = Number((formData as any).initialAmount) || 0;
  const subcontratos: Subcontrato[] = (formData as any).subcontratos || [];
  const gastos: Gasto[] = (formData as any).gastos || [];
  const costoDinamico = (formData as any).costoDinamico;
  const anticipo: Anticipo | null = (formData as any).anticipo ?? null;
  const estimaciones: Estimacion[] = (formData as any).estimaciones || [];
  const budgetModifications = (formData as any).budgetModifications || [];

  // Fuente de verdad: Costo Presupuestado CONSOLIDADO (inicial + modificaciones)
  const presupuestadoConsolidado = useMemo(
    () => consolidatedCosto(formData.financial?.costoDirectoProyecto as any, budgetModifications),
    [formData.financial?.costoDirectoProyecto, budgetModifications],
  );
  const montoProyectoConsolidado = useMemo(
    () =>
      initialAmount +
      (budgetModifications || []).reduce(
        (s: number, m: any) => s + (Number(m?.montoAmpliado) || 0),
        0,
      ),
    [initialAmount, budgetModifications],
  );

  const tabStorageKey = `project-tab:${storageKey}`;

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'basic';
    return sessionStorage.getItem(tabStorageKey) || 'basic';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(tabStorageKey, activeTab);
    }
    onActiveTabChange?.(activeTab);
  }, [activeTab, tabStorageKey, onActiveTabChange]);

  const [editBasic, setEditBasic] = useState(false);
  const [editPresupuestadoLocal, setEditPresupuestadoLocal] = useState(false);
  const editPresupuestado = presupuestadoEditingProp ?? editPresupuestadoLocal;

  // Auto-lock after save.
  useEffect(() => {
    if (savedSignal > 0) {
      setEditBasic(false);
      setEditPresupuestadoLocal(false);
      onPresupuestadoEditingChange?.(false);
    }
  }, [savedSignal]);

  const basicEditing = canEditProject && editBasic;
  const presupuestadoEditing = canEditCosts && editPresupuestado;


  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="w-full overflow-x-auto scrollbar-none">
        <TabsList className="flex-nowrap h-9 w-full min-w-max justify-start gap-1 p-1 text-xs sm:text-sm">
          <TabsTrigger value="basic" className="shrink-0 px-2 sm:px-3 text-xs sm:text-sm">Información Básica</TabsTrigger>
          <TabsTrigger value="garantias" className="shrink-0 px-2 sm:px-3 text-xs sm:text-sm">Garantías</TabsTrigger>
          <TabsTrigger value="anticipos" className="shrink-0 px-2 sm:px-3 text-xs sm:text-sm">Anticipos</TabsTrigger>
          <TabsTrigger value="estimaciones" className="shrink-0 px-2 sm:px-3 text-xs sm:text-sm">Estimaciones</TabsTrigger>
          <TabsTrigger value="presupuestado" className="shrink-0 px-2 sm:px-3 text-xs sm:text-sm">Costo Presupuestado</TabsTrigger>
          <TabsTrigger value="dinamico" className="shrink-0 px-2 sm:px-3 text-xs sm:text-sm">Costo Dinámico</TabsTrigger>
          <TabsTrigger value="diferencial" className="shrink-0 px-2 sm:px-3 text-xs sm:text-sm">Costo Diferencial</TabsTrigger>
          <TabsTrigger value="subcontratos" className="shrink-0 px-2 sm:px-3 text-xs sm:text-sm">Subcontratos</TabsTrigger>
          <TabsTrigger value="gastos" className="shrink-0 px-2 sm:px-3 text-xs sm:text-sm">Registro de Gastos</TabsTrigger>
          <TabsTrigger value="photos" className="shrink-0 px-2 sm:px-3 text-xs sm:text-sm">Fotos</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="basic" className="space-y-4 pt-4">
        {canEditProject && <EditToggle editing={editBasic} onToggle={() => setEditBasic(v => !v)} />}
        <BasicInformationSection formData={formData as any} onInputChange={onInputChange} disabled={!basicEditing} />
      </TabsContent>

      <TabsContent value="garantias" className="space-y-4 pt-4">
        <GarantiasSection
          projectId={storageKey}
          garantias={(formData as any).garantias || []}
          onChange={(next) => onInputChange('garantias', next)}
          readOnly={!canEditProject}
        />
      </TabsContent>

      <TabsContent value="anticipos" className="space-y-4 pt-4">
        <AnticiposSection
          anticipo={anticipo}
          estimaciones={estimaciones}
          onChange={(next) => onInputChange('anticipo', next)}
          onAutoSave={onAutoSave ? (next) => onAutoSave({ anticipo: next } as any) : undefined}
          readOnly={!canEditSubcontracts}
        />
      </TabsContent>

      <TabsContent value="estimaciones" className="space-y-4 pt-4">
        <EstimacionesSection
          estimaciones={estimaciones}
          onChange={(next) => onInputChange('estimaciones', next)}
          onAutoSave={onAutoSave ? (next) => onAutoSave({ estimaciones: next } as any) : undefined}
          readOnly={!canEditEstimations}
        />
      </TabsContent>

      <TabsContent value="presupuestado" className="space-y-4 pt-4">
        <CostoPresupuestadoSection
          costoDirectoProyecto={formData.financial.costoDirectoProyecto!}
          initialAmount={initialAmount}
          onInputChange={onInputChange}
          readOnly={!presupuestadoEditing}
          modsReadOnly={!canEditCosts}
          modificaciones={budgetModifications}
          onModificacionesChange={(next) => onInputChange('budgetModifications', next)}
          onModificacionesAutoSave={
            onAutoSave ? (next) => onAutoSave({ budgetModifications: next } as any) : undefined
          }
        />

      </TabsContent>

      <TabsContent value="dinamico" className="space-y-4 pt-4">
        <CostoDinamicoSection
          costoDinamico={costoDinamico}
          initialAmount={montoProyectoConsolidado}
          subcontratos={subcontratos}
          gastos={gastos}
          estimaciones={estimaciones}
          onInputChange={onInputChange}
          readOnly={!canEditCosts}
        />
      </TabsContent>

      <TabsContent value="diferencial" className="space-y-4 pt-4">
        <CostoDiferencialSection
          presupuestado={presupuestadoConsolidado}
          dinamico={costoDinamico}
          subcontratos={subcontratos}
          gastos={gastos}
          estimaciones={estimaciones}
          initialAmount={montoProyectoConsolidado}
        />
      </TabsContent>

      <TabsContent value="photos" className="pt-4">
        <PhotosSection photos={formData.photos} onPhotosChange={photos => onInputChange('photos', photos)} readOnly={!canEditProject} />
      </TabsContent>

      <TabsContent value="subcontratos" className="space-y-4 pt-4">
        <SubcontratosSection
          subcontratos={subcontratos}
          gastos={gastos}
          onChange={(next) => onInputChange('subcontratos', next)}
          onAutoSave={onAutoSave ? (next) => onAutoSave({ subcontratos: next } as any) : undefined}
          readOnly={!canEditSubcontracts}
        />
      </TabsContent>

      <TabsContent value="gastos" className="space-y-4 pt-4">
        <RegistroGastosSection
          gastos={gastos}
          subcontratos={subcontratos}
          onChange={(next) => onInputChange('gastos', next)}
          onAutoSave={onAutoSave ? (next) => onAutoSave({ gastos: next } as any) : undefined}
          readOnly={!canEditExpenses}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ProjectFormTabs;
