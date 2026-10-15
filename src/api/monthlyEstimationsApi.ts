
import { MonthlyEstimation } from "@/types/monthlyEstimation";
import { devLog } from '@/utils/secureLogger';

// Mock API for monthly estimations
let mockEstimations: MonthlyEstimation[] = [];

export const fetchMonthlyEstimations = async (projectId: string): Promise<MonthlyEstimation[]> => {
  devLog('Fetching monthly estimations for project:', projectId);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock data with status field included
  return [
    {
      id: '1',
      projectId,
      month: '2024-01',
      montoBruto: 150000,
      devolucionAnticipo: 15000,
      retencionCalidad: 7500,
      otrasDeduciones: 2000,
      totalNetoRecibido: 125500,
      status: 'En Conciliación'
    },
    {
      id: '2',
      projectId,
      month: '2024-02',
      montoBruto: 180000,
      devolucionAnticipo: 18000,
      retencionCalidad: 9000,
      otrasDeduciones: 1500,
      totalNetoRecibido: 151500,
      status: 'En Revisión'
    }
  ];
};

export const saveMonthlyEstimations = async (projectId: string, estimations: MonthlyEstimation[]): Promise<void> => {
  devLog('Saving monthly estimations for project:', projectId, estimations);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Update mock data
  mockEstimations = mockEstimations.filter(est => est.projectId !== projectId);
  mockEstimations.push(...estimations.map(est => ({ ...est, projectId })));
  
  devLog('Monthly estimations saved successfully');
};
