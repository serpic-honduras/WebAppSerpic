import { MonthlyEstimation } from "./monthlyEstimation";

export interface ProjectManager {
  name: string;
  email: string;
  phone: string;
}

export interface ClientContact {
  name: string;
  email: string;
  phone: string;
}

export interface MonthlyExpense {
  month: string; // YYYY-MM format
  amount: number;
  description?: string;
}

export interface CostoDirectoProyecto {
  costoDirecto: number;
  indirectosDeObra: number;
  fianzas: number;
  seguros: number;
  /** @deprecated kept for backward-compat with old records */
  fianzasYSeguros?: number;
  administracion: number;
  escalatoria: number;
  imprevistos: number;
  financieros: number;
  utilidad: number;
}

/** Modificación de presupuesto: amplía el monto y lo distribuye por rubro (%). */
export interface BudgetModification {
  id: string;
  numero: string;
  fechaEmision: string; // YYYY-MM-DD
  fechaNuevoPlazo: string; // YYYY-MM-DD
  montoAmpliado: number;
  /** Porcentaje asignado a cada rubro; la suma debe ser 100. */
  porcentajes: Record<string, number>;
}

export interface Subcontrato {
  id: string;
  nombre: string;
  descripcion: string;
  monto: number;
  /** When true, the row cannot be deleted (e.g. the seeded "Admin Serpic"). */
  locked?: boolean;
  /** @deprecated old field name */
  empresa?: string;
  /** @deprecated old field name */
  concepto?: string;
}

export type TipoGasto =
  | 'Costo Indirecto de Obra'
  | 'Fianzas'
  | 'Seguros'
  | 'Administración'
  | 'Escalatorias'
  | 'Imprevistos'
  | 'Financieros'
  | 'Costo Directo';

export type SubcategoriaCostoDirecto = 'Abono a contrato' | 'Materiales' | 'Planilla' | 'Anticipos';

export interface Gasto {
  id: string;
  fecha: string; // YYYY-MM-DD
  descripcion: string;
  montoPagado: number;
  subcontratistaId: string;
  tipoGasto: TipoGasto;
  subcategoriaCostoDirecto?: SubcategoriaCostoDirecto;
}

/** Garantía registrada del proyecto. */
export interface Garantia {
  id: string;
  numero: string;
  vigenciaInicio: string; // YYYY-MM-DD
  vigenciaFin: string; // YYYY-MM-DD
  monto: number;
}

export interface Anticipo {
  monto: number;
  fecha: string; // YYYY-MM-DD
}

export interface Estimacion {
  id: string;
  numero: string;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string; // YYYY-MM-DD
  monto: number;
  escalatorias: number;
  adminDelegada: number;
  montoBruto: number;
  deduccionAnticipo: number;
  deduccionCalidad: number;
  materialesAlmacenados: number;
  devolucionMaterialesAlmacenados: number;
  montoNeto: number;
  pagado: boolean;
}

export const calcMontoNeto = (e: {
  montoBruto: number;
  deduccionAnticipo: number;
  deduccionCalidad: number;
  materialesAlmacenados: number;
  devolucionMaterialesAlmacenados: number;
}) =>
  (Number(e.montoBruto) || 0) -
  (Number(e.deduccionAnticipo) || 0) -
  (Number(e.deduccionCalidad) || 0) +
  (Number(e.materialesAlmacenados) || 0) -
  (Number(e.devolucionMaterialesAlmacenados) || 0);

export interface Financial {
  contractAmount: number;
  monthlyExpenses: number;
  monthlyExpenseBreakdown: MonthlyExpense[];
  costoDirectoProyecto?: CostoDirectoProyecto;
}

export interface Bonds {
  performanceBond: number;
  performanceBondNumber?: string;
  performanceBondDate?: string;
  performanceBondIssuer?: string;
  advancePaymentBond: number;
  advancePaymentBondNumber?: string;
  advancePaymentBondDate?: string;
  advancePaymentBondIssuer?: string;
}

export interface Insurance {
  generalLiability: number;
  generalLiabilityDate?: string;
  generalLiabilityCompany?: string;
  workersComp: number;
  workersCompDate?: string;
  workersCompCompany?: string;
}

export interface Photo {
  id: string;
  url: string;
  caption: string;
  uploadDate: string;
}

export interface Addendum {
  id: string;
  title: string;
  description: string;
  amount?: number;
  date: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
}

export interface ChangeOrder {
  id: string;
  title: string;
  description: string;
  amount: number;
  date: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
}

export interface Project {
  id: string;
  name: string;
  client: string;
  clientContact: ClientContact;
  projectManager: ProjectManager;
  location: string;
  startDate: string;
  finishDate: string;
  estimatedCompletion: string;
  executionTime: string;
  currency: 'USD' | 'HNL' | 'EUR';
  financial: Financial;
  projectType: string;
  bonds: Bonds;
  insurance: Insurance;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  photos: Photo[];
  notes?: string;
  monthlyEstimations?: MonthlyEstimation[];
  addendums: Addendum[];
  changeOrders: ChangeOrder[];

  // New cost tabs
  costoDinamico?: CostoDirectoProyecto;
  /** Modificaciones de presupuesto (ampliaciones) registradas. */
  budgetModifications?: BudgetModification[];
  subcontratos?: Subcontrato[];
  gastos?: Gasto[];
  /** Garantías registradas. */
  garantias?: Garantia[];

  // Ingresos
  anticipo?: Anticipo | null;
  estimaciones?: Estimacion[];

  // ===== New fields =====
  contractNumber?: string;
  consortium?: string;
  residentName?: string;
  workType?: string;
  initialAmount?: number;
  initialTermDays?: number;
  startOrderDate?: string;

  // Cierre
  constructionM2?: number;
  activitiesDescription?: string;
  finalReceptionDate?: string;
  finalTermDays?: number;
  finalDurationMonths?: number;
  executionYear?: number;
  finalAmountHnl?: number;
  projectExchangeRate?: number;
  finalAmountUsd?: number;
}

export const ADMIN_SERPIC_ID = 'admin-serpic-default';
export const buildAdminSerpicSubcontrato = (): Subcontrato => ({
  id: ADMIN_SERPIC_ID,
  nombre: 'Admin Serpic',
  descripcion: 'Gastos internos / acreditados sin subcontratista externo',
  monto: 0,
  locked: true,
});
