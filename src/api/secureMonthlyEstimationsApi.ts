
import { supabase } from '@/integrations/supabase/client';
import { MonthlyEstimation } from '@/types/monthlyEstimation';
import { devError, devLog } from '@/utils/secureLogger';

export const fetchMonthlyEstimations = async (projectId: string): Promise<MonthlyEstimation[]> => {
  try {
    devLog('Fetching monthly estimations for project:', projectId);
    
    const { data, error } = await supabase
      .from('monthly_estimations')
      .select('*')
      .eq('project_id', projectId)
      .order('month', { ascending: true });

    if (error) {
      devError('Error fetching monthly estimations:', error);
      throw new Error('No se pudo completar la operación.');
    }

    devLog('Raw monthly estimations data:', data);

    if (!data) {
      return [];
    }

    // Transform database records to MonthlyEstimation objects
    const transformedEstimations: MonthlyEstimation[] = data.map(record => ({
      id: record.id,
      projectId: record.project_id,
      month: record.month,
      montoBruto: record.monto_bruto || 0,
      devolucionAnticipo: record.devolucion_anticipo || 0,
      retencionCalidad: record.retencion_calidad || 0,
      otrasDeduciones: record.otras_deducciones || 0,
      totalNetoRecibido: record.total_neto_recibido || 0,
      status: (record as any).status || 'En Conciliación'
    }));

    devLog('Transformed monthly estimations:', transformedEstimations);
    return transformedEstimations;

  } catch (error) {
    devError('Error in fetchMonthlyEstimations:', error);
    throw error;
  }
};

export const saveMonthlyEstimations = async (projectId: string, estimations: MonthlyEstimation[]): Promise<void> => {
  try {
    devLog('Saving monthly estimations for project:', projectId);
    devLog('Estimations to save:', estimations);

    // First, delete existing estimations for this project
    const { error: deleteError } = await supabase
      .from('monthly_estimations')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) {
      devError('Error deleting existing estimations:', deleteError);
      throw new Error('No se pudo completar la operación.');
    }

    // Then insert new estimations
    if (estimations.length > 0) {
      const estimationsToInsert = estimations.map(estimation => ({
        project_id: projectId,
        month: estimation.month,
        monto_bruto: estimation.montoBruto,
        devolucion_anticipo: estimation.devolucionAnticipo,
        retencion_calidad: estimation.retencionCalidad,
        otras_deducciones: estimation.otrasDeduciones,
        total_neto_recibido: estimation.totalNetoRecibido,
        status: estimation.status || 'En Conciliación'
      }));

      const { error: insertError } = await supabase
        .from('monthly_estimations')
        .insert(estimationsToInsert);

      if (insertError) {
        devError('Error inserting monthly estimations:', insertError);
        throw new Error('No se pudo completar la operación.');
      }
    }

    devLog('Monthly estimations saved successfully');
  } catch (error) {
    devError('Error in saveMonthlyEstimations:', error);
    throw error;
  }
};
