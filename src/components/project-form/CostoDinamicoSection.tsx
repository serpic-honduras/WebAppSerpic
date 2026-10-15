import React from 'react';
import CostBreakdownSection from './CostBreakdownSection';
import { CostoDirectoProyecto, Subcontrato, Gasto, TipoGasto, Estimacion } from '@/types/project';

interface Props {
  costoDinamico: CostoDirectoProyecto;
  initialAmount: number;
  subcontratos: Subcontrato[];
  gastos: Gasto[];
  estimaciones?: Estimacion[];
  onInputChange: (field: string, value: any) => void;
  readOnly?: boolean;
}

const TIPO_TO_KEY: Record<TipoGasto, keyof CostoDirectoProyecto> = {
  'Costo Indirecto de Obra': 'indirectosDeObra',
  'Fianzas': 'fianzas',
  'Seguros': 'seguros',
  'Administración': 'administracion',
  'Escalatorias': 'escalatoria',
  'Imprevistos': 'imprevistos',
  'Financieros': 'financieros',
  'Costo Directo': 'costoDirecto',
};

const CostoDinamicoSection: React.FC<Props> = ({
  costoDinamico,
  initialAmount,
  subcontratos,
  gastos,
  estimaciones,
  onInputChange,
  readOnly = false,
}) => {
  // Subcontratos NO longer auto-feed Costo Directo. Only real expenses from
  // "Registro de Gastos" affect Costo Dinámico.
  const autoFedValues: Partial<Record<keyof CostoDirectoProyecto, number>> = React.useMemo(() => {
    const acc: Partial<Record<keyof CostoDirectoProyecto, number>> = {};
    for (const g of gastos || []) {
      const key = TIPO_TO_KEY[g.tipoGasto];
      if (!key) continue;
      acc[key] = (acc[key] || 0) + (Number(g.montoPagado) || 0);
    }

    // Utilidad dinámica = Total Monto Bruto de Estimaciones - suma de los 8 costos dinámicos
    const totalBruto = (estimaciones || []).reduce(
      (s, e) => s + (Number(e.montoBruto) || 0),
      0,
    );
    const COST_KEYS: (keyof CostoDirectoProyecto)[] = [
      'costoDirecto',
      'indirectosDeObra',
      'fianzas',
      'seguros',
      'administracion',
      'escalatoria',
      'imprevistos',
      'financieros',
    ];
    const sumCostos = COST_KEYS.reduce((s, k) => s + (Number(acc[k]) || 0), 0);
    acc.utilidad = totalBruto - sumCostos;

    return acc;
  }, [gastos, estimaciones]);


  return (
    <div className="space-y-6 text-left">
      <CostBreakdownSection
        title="Costo Dinámico"
        values={costoDinamico}
        montoProyecto={initialAmount}
        fieldPathPrefix="costoDinamico"
        onInputChange={onInputChange}
        autoFedValues={autoFedValues}
        readOnlyAll
        showSubTotal

        fieldNotes={{
          utilidad: (
            <>
              <span className="font-medium text-foreground">
                Utilidad (L) = Total Monto Bruto Estimaciones − Suma de Costos Ejecutados
              </span>
              <br />
              (Total Monto Bruto Estimado − [Costo Directo + Indirectos + Fianzas + Seguros +
              Administración + Escalatorias + Imprevistos + Financieros])
            </>
          ),
        }}
      />
      <p className="text-xs text-muted-foreground">
        Todos los valores se calculan automáticamente a partir de los registros de la pestaña
        "Registro de Gastos".
      </p>
    </div>
  );
};

export default CostoDinamicoSection;
