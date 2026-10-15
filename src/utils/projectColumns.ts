import { Project } from "@/types/project";
import { formatCurrency, getExchangeRate, convertToLempiras } from "@/utils/currencyUtils";

export type ColAlign = "left" | "right" | "center";

export interface ColumnDef {
  key: string;
  label: string;
  align: ColAlign;
  defaultVisible: boolean;
  /** Display value as string for the table & export */
  value: (p: Project) => string;
  /** Numeric/raw value for Excel (optional) */
  raw?: (p: Project) => string | number | null;
}

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("es-HN", { year: "numeric", month: "short", day: "numeric" }) : "";

const statusLabel: Record<string, string> = {
  "In Progress": "En Progreso",
  Planning: "Planificación",
  Completed: "Completado",
  "On Hold": "En Espera",
};

const contractHNL = (p: Project) =>
  p.finalAmountHnl ?? convertToLempiras(p.financial?.contractAmount ?? 0, getExchangeRate(p.startDate));
const contractUSD = (p: Project) =>
  p.finalAmountUsd ?? p.financial?.contractAmount ?? 0;

export const PROJECT_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Nombre", align: "left", defaultVisible: true, value: (p) => p.name },
  { key: "contractNumber", label: "N° Contrato", align: "center", defaultVisible: false, value: (p) => p.contractNumber ?? "" },
  { key: "client", label: "Cliente", align: "left", defaultVisible: true, value: (p) => p.client },
  { key: "clientContactName", label: "Contacto", align: "center", defaultVisible: false, value: (p) => p.clientContact?.name ?? "" },
  { key: "clientContactPhone", label: "Teléfono", align: "center", defaultVisible: false, value: (p) => p.clientContact?.phone ?? "" },
  { key: "clientContactEmail", label: "Correo", align: "center", defaultVisible: false, value: (p) => p.clientContact?.email ?? "" },
  { key: "projectManager", label: "Gestor", align: "center", defaultVisible: true, value: (p) => p.projectManager?.name ?? "" },
  { key: "location", label: "Ubicación", align: "center", defaultVisible: false, value: (p) => p.location ?? "" },
  { key: "consortium", label: "Consorcio", align: "center", defaultVisible: false, value: (p) => p.consortium ?? "" },
  { key: "residentName", label: "Residente", align: "center", defaultVisible: false, value: (p) => p.residentName ?? "" },
  { key: "workType", label: "Tipo de Obra", align: "center", defaultVisible: false, value: (p) => p.workType ?? "" },
  { key: "projectType", label: "Tipo", align: "center", defaultVisible: true, value: (p) => p.projectType ?? "" },
  { key: "constructionM2", label: "M² Construcción", align: "right", defaultVisible: false, value: (p) => p.constructionM2 != null ? String(p.constructionM2) : "", raw: (p) => p.constructionM2 ?? null },
  { key: "executionYear", label: "Año", align: "center", defaultVisible: false, value: (p) => p.executionYear ? String(p.executionYear) : "", raw: (p) => p.executionYear ?? null },
  { key: "initialTermDays", label: "Plazo Inicial (d)", align: "right", defaultVisible: false, value: (p) => p.initialTermDays != null ? String(p.initialTermDays) : "", raw: (p) => p.initialTermDays ?? null },
  { key: "finalTermDays", label: "Plazo Final (d)", align: "right", defaultVisible: false, value: (p) => p.finalTermDays != null ? String(p.finalTermDays) : "", raw: (p) => p.finalTermDays ?? null },
  { key: "startOrderDate", label: "Orden de Inicio", align: "center", defaultVisible: true, value: (p) => fmtDate(p.startOrderDate) },
  { key: "finalReceptionDate", label: "Recepción Final", align: "center", defaultVisible: false, value: (p) => fmtDate(p.finalReceptionDate) },
  { key: "initialAmount", label: "Monto Inicial L", align: "right", defaultVisible: false, value: (p) => p.initialAmount != null ? formatCurrency(p.initialAmount, "HNL") : "", raw: (p) => p.initialAmount ?? null },
  { key: "contractAmountHNL", label: "Monto Contrato L", align: "right", defaultVisible: true, value: (p) => formatCurrency(contractHNL(p), "HNL"), raw: (p) => contractHNL(p) },
  { key: "contractAmountUSD", label: "Monto Contrato $", align: "right", defaultVisible: false, value: (p) => formatCurrency(contractUSD(p), "USD"), raw: (p) => contractUSD(p) },
  { key: "projectExchangeRate", label: "Tasa de Cambio", align: "right", defaultVisible: false, value: (p) => p.projectExchangeRate != null ? p.projectExchangeRate.toFixed(4) : "", raw: (p) => p.projectExchangeRate ?? null },
  { key: "status", label: "Estado", align: "center", defaultVisible: true, value: (p) => statusLabel[p.status] ?? p.status },
  { key: "notes", label: "Notas", align: "left", defaultVisible: false, value: (p) => p.notes ?? "" },
];

export const DEFAULT_VISIBLE_KEYS = PROJECT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
