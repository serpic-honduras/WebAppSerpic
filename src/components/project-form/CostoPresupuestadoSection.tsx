import React, { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CostBreakdownSection from './CostBreakdownSection';
import ModificacionesSection from './ModificacionesSection';
import { BudgetModification, CostoDirectoProyecto } from '@/types/project';
import { consolidatedCosto } from '@/utils/budgetModifications';

interface Props {
  costoDirectoProyecto: CostoDirectoProyecto;
  initialAmount: number;
  onInputChange: (field: string, value: any) => void;
  readOnly?: boolean;
  /** Modifications sub-tab is always editable unless the user lacks permission. */
  modsReadOnly?: boolean;
  modificaciones?: BudgetModification[];
  onModificacionesChange?: (next: BudgetModification[]) => void;
  onModificacionesAutoSave?: (next: BudgetModification[]) => Promise<void> | void;
}

const CostoPresupuestadoSection: React.FC<Props> = ({
  costoDirectoProyecto,
  initialAmount,
  onInputChange,
  readOnly = false,
  modsReadOnly = false,
  modificaciones = [],
  onModificacionesChange,
  onModificacionesAutoSave,
}) => {
  const [subTab, setSubTab] = useState('inicial');

  const consolidado = useMemo(
    () => consolidatedCosto(costoDirectoProyecto, modificaciones),
    [costoDirectoProyecto, modificaciones],
  );

  const montoAmpliadoTotal = useMemo(
    () => modificaciones.reduce((s, m) => s + (Number(m.montoAmpliado) || 0), 0),
    [modificaciones],
  );

  return (
    <div className="space-y-6 text-left">
      <Tabs value={subTab} onValueChange={setSubTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto w-full justify-start gap-1 p-1">
          <TabsTrigger value="inicial" className="flex-grow sm:flex-grow-0">Presupuesto Inicial</TabsTrigger>
          <TabsTrigger value="modificaciones" className="flex-grow sm:flex-grow-0">Modificaciones</TabsTrigger>
          <TabsTrigger value="consolidado" className="flex-grow sm:flex-grow-0">Costo Presupuestado</TabsTrigger>
        </TabsList>

        <TabsContent value="inicial" className="pt-4">
          <CostBreakdownSection
            title="Presupuesto Inicial"
            values={costoDirectoProyecto}
            montoProyecto={initialAmount}
            fieldPathPrefix="financial.costoDirectoProyecto"
            onInputChange={onInputChange}
            readOnlyAll={readOnly}
            showSubTotal
          />
        </TabsContent>

        <TabsContent value="modificaciones" className="pt-4">
          <ModificacionesSection
            presupuestoInicial={costoDirectoProyecto}
            modificaciones={modificaciones}
            onChange={(next) => onModificacionesChange?.(next)}
            onAutoSave={onModificacionesAutoSave}
            readOnly={modsReadOnly || !onModificacionesChange}
          />
        </TabsContent>

        <TabsContent value="consolidado" className="pt-4">
          <CostBreakdownSection
            title="Costo Presupuestado (Consolidado)"
            values={consolidado}
            montoProyecto={(Number(initialAmount) || 0) + montoAmpliadoTotal}
            fieldPathPrefix="consolidado.costoPresupuestado"
            onInputChange={() => {}}
            readOnlyAll
            autoFedValues={consolidado}
            showSubTotal
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CostoPresupuestadoSection;
