
import { Project, CostoDirectoProyecto, Subcontrato, Gasto, Anticipo, Estimacion, BudgetModification, Garantia, calcMontoNeto } from "@/types/project";

const normalizeGarantias = (raw: any): Garantia[] => {
  const arr: any[] = Array.isArray(raw) ? raw : [];
  return arr.map((g) => ({
    id: g.id || crypto.randomUUID(),
    numero: String(g.numero ?? ''),
    vigenciaInicio: g.vigenciaInicio || '',
    vigenciaFin: g.vigenciaFin || '',
    monto: Number(g.monto) || 0,
  }));
};

const normalizeAnticipo = (raw: any): Anticipo | null => {
  if (!raw) return null;
  return { monto: Number(raw.monto) || 0, fecha: raw.fecha || '' };
};

const normalizeEstimaciones = (raw: any): Estimacion[] => {
  const arr: any[] = Array.isArray(raw) ? raw : [];
  return arr.map((e) => {
    const monto = Number(e.monto) || 0;
    const escalatorias = Number(e.escalatorias) || 0;
    const adminDelegada = Number(e.adminDelegada) || 0;
    const base = {
      monto,
      escalatorias,
      adminDelegada,
      montoBruto: Number(e.montoBruto) || monto + escalatorias + adminDelegada,
      deduccionAnticipo: Number(e.deduccionAnticipo) || 0,
      deduccionCalidad: Number(e.deduccionCalidad) || 0,
      materialesAlmacenados: Number(e.materialesAlmacenados) || 0,
      devolucionMaterialesAlmacenados: Number(e.devolucionMaterialesAlmacenados) || 0,
    };
    return {
      id: e.id || crypto.randomUUID(),
      numero: String(e.numero ?? ''),
      fechaInicio: e.fechaInicio || '',
      fechaFin: e.fechaFin || '',
      ...base,
      montoNeto: Number(e.montoNeto) || calcMontoNeto(base),
      pagado: !!e.pagado,
    };
  });
};

const normalizeCosto = (raw: any): CostoDirectoProyecto => {
  const r = raw || {};
  const legacyFS = Number(r.fianzasYSeguros) || 0;
  return {
    costoDirecto: Number(r.costoDirecto) || 0,
    indirectosDeObra: Number(r.indirectosDeObra) || 0,
    fianzas: Number(r.fianzas) || (legacyFS ? legacyFS / 2 : 0),
    seguros: Number(r.seguros) || (legacyFS ? legacyFS / 2 : 0),
    administracion: Number(r.administracion) || 0,
    escalatoria: Number(r.escalatoria) || 0,
    imprevistos: Number(r.imprevistos) || 0,
    financieros: Number(r.financieros) || 0,
    utilidad: Number(r.utilidad) || 0,
  };
};

const normalizeBudgetModifications = (raw: any): BudgetModification[] => {
  const arr: any[] = Array.isArray(raw) ? raw : [];
  return arr.map((m) => {
    const porcentajes: Record<string, number> = {};
    Object.keys(m?.porcentajes || {}).forEach((k) => {
      porcentajes[k] = Number(m.porcentajes[k]) || 0;
    });
    return {
      id: m.id || crypto.randomUUID(),
      numero: String(m.numero ?? ''),
      fechaEmision: m.fechaEmision || '',
      fechaNuevoPlazo: m.fechaNuevoPlazo || '',
      montoAmpliado: Number(m.montoAmpliado) || 0,
      porcentajes,
    };
  });
};

const normalizeSubcontratos = (raw: any): Subcontrato[] => {
  const arr: any[] = Array.isArray(raw) ? raw : [];
  return arr
    // Drop any legacy seeded "Admin Serpic" row.
    .filter((s) => s?.id !== 'admin-serpic-default')
    .map((s) => ({
      id: s.id || crypto.randomUUID(),
      nombre: s.nombre ?? s.empresa ?? '',
      descripcion: s.descripcion ?? s.concepto ?? '',
      monto: Number(s.monto) || 0,
    }));
};

const normalizeGastos = (raw: any): Gasto[] => {
  const arr: any[] = Array.isArray(raw) ? raw : [];
  return arr.map((g) => ({
    id: g.id || crypto.randomUUID(),
    fecha: g.fecha || '',
    descripcion: g.descripcion || '',
    montoPagado: Number(g.montoPagado) || 0,
    subcontratistaId: g.subcontratistaId || '',
    tipoGasto: g.tipoGasto || 'Costo Directo',
    subcategoriaCostoDirecto: g.subcategoriaCostoDirecto,
  }));
};

export const transformDatabaseToProject = (dbProject: any): Project => {
  const photosData = dbProject.photos
    ? (typeof dbProject.photos === 'string' ? JSON.parse(dbProject.photos) : dbProject.photos)
    : {};

  return {
    id: dbProject.id,
    name: dbProject.name,
    client: dbProject.client,
    clientContact: {
      name: dbProject.client_contact_name ?? photosData.clientContactName ?? '',
      email: dbProject.client_email ?? photosData.clientEmail ?? '',
      phone: dbProject.client_phone ?? photosData.clientPhone ?? '',
    },
    projectManager: {
      name: dbProject.project_manager_name || '',
      email: dbProject.project_manager_email || '',
      phone: dbProject.project_manager_phone || '',
    },
    location: photosData.location || '',
    startDate: dbProject.start_date || dbProject.start_order_date || '',
    finishDate: dbProject.finish_date || dbProject.final_reception_date || '',
    estimatedCompletion: dbProject.estimated_completion || '',
    executionTime: photosData.executionTime || '',
    currency: (photosData.currency || 'HNL') as 'USD' | 'HNL' | 'EUR',
    financial: {
      contractAmount: Number(dbProject.contract_amount) || 0,
      monthlyExpenses: Number(dbProject.monthly_expenses) || 0,
      monthlyExpenseBreakdown: photosData.monthlyExpenseBreakdown || [],
      costoDirectoProyecto: normalizeCosto(photosData.costoDirectoProyecto),
    },
    costoDinamico: normalizeCosto(photosData.costoDinamico),
    budgetModifications: normalizeBudgetModifications(photosData.budgetModifications),
    subcontratos: normalizeSubcontratos(photosData.subcontratos),
    gastos: normalizeGastos(photosData.gastos),
    garantias: normalizeGarantias(photosData.garantias),
    anticipo: normalizeAnticipo(photosData.anticipo),
    estimaciones: normalizeEstimaciones(photosData.estimaciones),
    projectType: dbProject.project_type || dbProject.work_type || '',
    bonds: {
      performanceBond: Number(dbProject.performance_bond) || 0,
      performanceBondNumber: photosData.performanceBondNumber,
      performanceBondDate: photosData.performanceBondDate,
      performanceBondIssuer: photosData.performanceBondIssuer,
      advancePaymentBond: photosData.advancePaymentBond || 0,
      advancePaymentBondNumber: photosData.advancePaymentBondNumber,
      advancePaymentBondDate: photosData.advancePaymentBondDate,
      advancePaymentBondIssuer: photosData.advancePaymentBondIssuer,
    },
    insurance: {
      generalLiability: Number(dbProject.general_liability) || 0,
      generalLiabilityDate: photosData.generalLiabilityDate,
      generalLiabilityCompany: photosData.generalLiabilityCompany,
      workersComp: Number(dbProject.workers_comp) || 0,
      workersCompDate: photosData.workersCompDate,
      workersCompCompany: photosData.workersCompCompany,
    },
    status: dbProject.status as 'Planning' | 'In Progress' | 'Completed' | 'On Hold',
    photos: photosData.photos || [],
    notes: dbProject.notes || '',
    addendums: photosData.addendums || [],
    changeOrders: photosData.changeOrders || [],

    contractNumber: dbProject.contract_number ?? '',
    consortium: dbProject.consortium ?? '',
    residentName: dbProject.resident_name ?? '',
    workType: dbProject.work_type ?? '',
    initialAmount: dbProject.initial_amount != null ? Number(dbProject.initial_amount) : undefined,
    initialTermDays: dbProject.initial_term_days ?? undefined,
    startOrderDate: dbProject.start_order_date ?? '',
    constructionM2: dbProject.construction_m2 != null ? Number(dbProject.construction_m2) : undefined,
    activitiesDescription: dbProject.activities_description ?? '',
    finalReceptionDate: dbProject.final_reception_date ?? '',
    finalTermDays: dbProject.final_term_days ?? undefined,
    finalDurationMonths: dbProject.final_duration_months != null ? Number(dbProject.final_duration_months) : undefined,
    executionYear: dbProject.execution_year ?? undefined,
    finalAmountHnl: dbProject.final_amount_hnl != null ? Number(dbProject.final_amount_hnl) : undefined,
    projectExchangeRate: dbProject.project_exchange_rate != null ? Number(dbProject.project_exchange_rate) : undefined,
    finalAmountUsd: dbProject.final_amount_usd != null ? Number(dbProject.final_amount_usd) : undefined,
  };
};

export const transformProjectToDatabase = (
  project: Omit<Project, 'id'>,
  userId: string
): any => {
  const photosJson = {
    photos: (project.photos || []).map(photo => ({
      id: photo.id,
      url: photo.url,
      caption: photo.caption,
      uploadDate: photo.uploadDate,
    })),
    monthlyExpenseBreakdown: (project.financial.monthlyExpenseBreakdown || []).map(expense => ({
      month: expense.month,
      amount: expense.amount,
      description: expense.description || '',
    })),
    costoDirectoProyecto: project.financial.costoDirectoProyecto || normalizeCosto(null),
    costoDinamico: project.costoDinamico || normalizeCosto(null),
    budgetModifications: normalizeBudgetModifications(project.budgetModifications),
    subcontratos: normalizeSubcontratos(project.subcontratos),
    gastos: normalizeGastos(project.gastos),
    garantias: normalizeGarantias(project.garantias),
    anticipo: normalizeAnticipo(project.anticipo),
    estimaciones: normalizeEstimaciones(project.estimaciones),
    performanceBondNumber: project.bonds.performanceBondNumber || '',
    performanceBondDate: project.bonds.performanceBondDate || '',
    performanceBondIssuer: project.bonds.performanceBondIssuer || '',
    advancePaymentBond: project.bonds.advancePaymentBond || 0,
    advancePaymentBondNumber: project.bonds.advancePaymentBondNumber || '',
    advancePaymentBondDate: project.bonds.advancePaymentBondDate || '',
    advancePaymentBondIssuer: project.bonds.advancePaymentBondIssuer || '',
    clientContactName: project.clientContact.name || '',
    clientEmail: project.clientContact.email || '',
    clientPhone: project.clientContact.phone || '',
    generalLiabilityDate: project.insurance.generalLiabilityDate || '',
    generalLiabilityCompany: project.insurance.generalLiabilityCompany || '',
    workersCompDate: project.insurance.workersCompDate || '',
    workersCompCompany: project.insurance.workersCompCompany || '',
    executionTime: project.executionTime || '',
    currency: project.currency || 'HNL',
    location: project.location || '',
    addendums: project.addendums || [],
    changeOrders: project.changeOrders || [],
  };

  return {
    user_id: userId,
    name: project.name,
    client: project.client,
    project_manager_name: project.projectManager?.name || '',
    project_manager_email: project.projectManager?.email || '',
    project_manager_phone: project.projectManager?.phone || '',
    start_date: project.startDate || project.startOrderDate || null,
    finish_date: project.finishDate || project.finalReceptionDate || null,
    estimated_completion: project.estimatedCompletion || null,
    contract_amount: project.financial.contractAmount || project.initialAmount || 0,
    monthly_expenses: project.financial.monthlyExpenses || 0,
    project_type: project.workType || project.projectType || '',
    performance_bond: project.bonds.performanceBond || 0,
    payment_bond: 0,
    general_liability: project.insurance.generalLiability || 0,
    workers_comp: project.insurance.workersComp || 0,
    status: project.status,
    photos: photosJson as any,
    notes: project.notes || '',

    contract_number: project.contractNumber || null,
    consortium: project.consortium || null,
    resident_name: project.residentName || null,
    work_type: project.workType || null,
    initial_amount: project.initialAmount ?? null,
    initial_term_days: project.initialTermDays ?? null,
    start_order_date: project.startOrderDate || null,
    client_phone: project.clientContact?.phone || null,
    client_contact_name: project.clientContact?.name || null,
    client_email: project.clientContact?.email || null,
    construction_m2: project.constructionM2 ?? null,
    activities_description: project.activitiesDescription || null,
    final_reception_date: project.finalReceptionDate || null,
    final_term_days: project.finalTermDays ?? null,
    final_duration_months: project.finalDurationMonths ?? null,
    execution_year: project.executionYear ?? null,
    final_amount_hnl: project.finalAmountHnl ?? null,
    project_exchange_rate: project.projectExchangeRate ?? null,
    final_amount_usd: project.finalAmountUsd ?? null,
  };
};
