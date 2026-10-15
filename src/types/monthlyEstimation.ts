
export interface MonthlyEstimation {
  id?: string;
  projectId?: string;
  month: string; // YYYY-MM format
  montoBruto: number;
  devolucionAnticipo: number;
  retencionCalidad: number;
  otrasDeduciones: number;
  totalNetoRecibido: number;
  status: 'En Conciliación' | 'En Revisión' | 'En Subsanación' | 'Aprobada' | 'Pagada'; // New status field
}
