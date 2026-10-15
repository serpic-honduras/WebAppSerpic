
import { useState, useEffect, useCallback } from 'react';
import { Project, MonthlyExpense } from '@/types/project';
import { MonthlyEstimation } from '@/types/monthlyEstimation';


const buildInitialFormData = (project?: Project | null) => ({
  id: project?.id || '',
  name: project?.name || '',
  client: project?.client || '',
  location: project?.location || '',
  clientContact: {
    name: project?.clientContact?.name || '',
    email: project?.clientContact?.email || '',
    phone: project?.clientContact?.phone || '',
  },
  projectManager: {
    name: project?.projectManager?.name || '',
    email: project?.projectManager?.email || '',
    phone: project?.projectManager?.phone || '',
  },
  startDate: project?.startDate || '',
  finishDate: project?.finishDate || '',
  estimatedCompletion: project?.estimatedCompletion || '',
  executionTime: project?.executionTime || '',
  currency: (project?.currency || 'HNL') as 'USD' | 'HNL' | 'EUR',
  financial: {
    contractAmount: project?.financial?.contractAmount || 0,
    monthlyExpenses: project?.financial?.monthlyExpenses || 0,
    monthlyExpenseBreakdown: project?.financial?.monthlyExpenseBreakdown || [],
    costoDirectoProyecto: project?.financial?.costoDirectoProyecto || {
      costoDirecto: 0,
      indirectosDeObra: 0,
      fianzas: 0,
      seguros: 0,
      administracion: 0,
      escalatoria: 0,
      imprevistos: 0,
      financieros: 0,
      utilidad: 0,
    },
  },
  costoDinamico: project?.costoDinamico || {
    costoDirecto: 0,
    indirectosDeObra: 0,
    fianzas: 0,
    seguros: 0,
    administracion: 0,
    escalatoria: 0,
    imprevistos: 0,
    financieros: 0,
    utilidad: 0,
  },
  budgetModifications: project?.budgetModifications || [],
  subcontratos: project?.subcontratos || [],
  gastos: project?.gastos || [],
  garantias: project?.garantias || [],
  anticipo: project?.anticipo ?? null,
  estimaciones: project?.estimaciones || [],
  projectType: project?.projectType || '',
  bonds: {
    performanceBond: project?.bonds?.performanceBond || 0,
    performanceBondNumber: project?.bonds?.performanceBondNumber || '',
    performanceBondDate: project?.bonds?.performanceBondDate || '',
    performanceBondIssuer: project?.bonds?.performanceBondIssuer || '',
    advancePaymentBond: project?.bonds?.advancePaymentBond || 0,
    advancePaymentBondNumber: project?.bonds?.advancePaymentBondNumber || '',
    advancePaymentBondDate: project?.bonds?.advancePaymentBondDate || '',
    advancePaymentBondIssuer: project?.bonds?.advancePaymentBondIssuer || '',
  },
  insurance: {
    generalLiability: project?.insurance?.generalLiability || 0,
    generalLiabilityDate: project?.insurance?.generalLiabilityDate || '',
    generalLiabilityCompany: project?.insurance?.generalLiabilityCompany || '',
    workersComp: project?.insurance?.workersComp || 0,
    workersCompDate: project?.insurance?.workersCompDate || '',
    workersCompCompany: project?.insurance?.workersCompCompany || '',
  },
  status: (project?.status || 'Planning') as 'Planning' | 'In Progress' | 'Completed' | 'On Hold',
  photos: project?.photos || [],
  notes: project?.notes || '',
  addendums: project?.addendums || [],
  changeOrders: project?.changeOrders || [],

  // New fields
  contractNumber: project?.contractNumber || '',
  consortium: project?.consortium || '',
  residentName: project?.residentName || '',
  workType: project?.workType || '',
  initialAmount: project?.initialAmount ?? 0,
  initialTermDays: project?.initialTermDays ?? 0,
  startOrderDate: project?.startOrderDate || '',
  constructionM2: project?.constructionM2 ?? 0,
  activitiesDescription: project?.activitiesDescription || '',
  finalReceptionDate: project?.finalReceptionDate || '',
  finalTermDays: project?.finalTermDays ?? 0,
  finalDurationMonths: project?.finalDurationMonths ?? 0,
  executionYear: project?.executionYear ?? new Date().getFullYear(),
  finalAmountHnl: project?.finalAmountHnl ?? 0,
  projectExchangeRate: project?.projectExchangeRate ?? 0,
  finalAmountUsd: project?.finalAmountUsd ?? 0,
});

export const useProjectForm = (project?: Project | null) => {
  const [formData, setFormData] = useState(buildInitialFormData(project));

  const [monthlyEstimations, setMonthlyEstimations] = useState<MonthlyEstimation[]>(
    project?.monthlyEstimations || []
  );

  useEffect(() => {
    if (project) {
      setFormData(buildInitialFormData(project));
      setMonthlyEstimations(project.monthlyEstimations || []);
    }
  }, [project]);

  // Auto-calc Monto Final USD = HNL * exchange rate
  useEffect(() => {
    const hnl = Number(formData.finalAmountHnl) || 0;
    const rate = Number(formData.projectExchangeRate) || 0;
    const usd = rate > 0 ? hnl * rate : 0;
    if (usd !== formData.finalAmountUsd) {
      setFormData(prev => ({ ...prev, finalAmountUsd: usd }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.finalAmountHnl, formData.projectExchangeRate]);



  const handleInputChange = useCallback((field: string, value: any) => {
    const fields = field.split('.');
    setFormData(prev => {
      const newData: any = { ...prev };
      let current: any = newData;

      for (let i = 0; i < fields.length - 1; i++) {
        current[fields[i]] = { ...(current[fields[i]] || {}) };
        current = current[fields[i]];
      }

      current[fields[fields.length - 1]] = value;
      return newData;
    });
  }, []);

  const handleMonthlyExpensesChange = useCallback((expenses: MonthlyExpense[]) => {
    setFormData(prev => ({
      ...prev,
      financial: {
        ...prev.financial,
        monthlyExpenseBreakdown: expenses,
        monthlyExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0)
      }
    }));
  }, []);

  const handleEstimationsChange = useCallback((estimations: MonthlyEstimation[]) => {
    setMonthlyEstimations(estimations);
  }, []);

  return {
    formData,
    monthlyEstimations,
    handleInputChange,
    handleMonthlyExpensesChange,
    handleEstimationsChange
  };
};
