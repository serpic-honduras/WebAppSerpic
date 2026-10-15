import { supabase } from '@/integrations/supabase/client';
import { Garantia } from '@/types/project';
import { devError } from '@/utils/secureLogger';

export type GarantiaRow = {
  id: string;
  numero_garantia: string;
  vigencia_inicio: string | null;
  vigencia_fin: string | null;
  monto: number;
};

const toApp = (row: GarantiaRow): Garantia => ({
  id: row.id,
  numero: row.numero_garantia ?? '',
  vigenciaInicio: row.vigencia_inicio || '',
  vigenciaFin: row.vigencia_fin || '',
  monto: Number(row.monto) || 0,
});

export const fetchGarantias = async (projectId: string): Promise<Garantia[]> => {
  if (!projectId || projectId === 'new') return [];
  const { data, error } = await supabase
    .from('garantias')
    .select('id, numero_garantia, vigencia_inicio, vigencia_fin, monto')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) {
    devError('cargar garantías', error);
    throw error;
  }
  return (data as GarantiaRow[]).map(toApp);
};

export const upsertGarantia = async (
  projectId: string,
  garantia: Garantia
): Promise<Garantia> => {
  // Keep the client-side id when editing so the row identity is stable.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const hasDbId = isUuid.test(garantia.id);

  const payload = {
    ...(hasDbId ? { id: garantia.id } : {}),
    project_id: projectId,
    numero_garantia: garantia.numero,
    vigencia_inicio: garantia.vigenciaInicio || null,
    vigencia_fin: garantia.vigenciaFin || null,
    monto: Number(garantia.monto) || 0,
  };

  const { data, error } = await supabase
    .from('garantias')
    .upsert(payload)
    .select('id, numero_garantia, vigencia_inicio, vigencia_fin, monto')
    .single();
  if (error) {
    devError('guardar garantía', error);
    throw error;
  }
  return toApp(data as GarantiaRow);
};

export const deleteGarantia = async (id: string): Promise<void> => {
  const { error } = await supabase.from('garantias').delete().eq('id', id);
  if (error) {
    devError('eliminar garantía', error);
    throw error;
  }
};
