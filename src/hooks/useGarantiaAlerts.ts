import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { useAlertSettings } from '@/hooks/useAlertSettings';
import { devError } from '@/utils/secureLogger';

export interface GarantiaAlert {
  id: string;
  numero: string;
  projectId: string;
  projectName: string;
  vencimiento: string;
  daysLeft: number;
  expired: boolean;
}

const daysBetween = (target: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${target}T00:00:00`);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
};

/** Guarantees expiring within the configured window (or already expired). */
export const useGarantiaAlerts = () => {
  const { user } = useSecureAuth();
  const { settings } = useAlertSettings();
  const [rows, setRows] = useState<
    { id: string; numero_garantia: string; vigencia_fin: string | null; project_id: string; projects: { name: string } | null }[]
  >([]);

  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }
    let cancelled = false;
    supabase
      .from('garantias')
      .select('id, numero_garantia, vigencia_fin, project_id, projects(name)')
      .not('vigencia_fin', 'is', null)
      .order('vigencia_fin', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          devError('cargar alertas de garantías', error);
          return;
        }
        setRows((data as any) || []);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const alerts = useMemo<GarantiaAlert[]>(() => {
    const limit = settings.garantiasDays;
    return rows
      .filter((r) => !!r.vigencia_fin)
      .map((r) => {
        const daysLeft = daysBetween(r.vigencia_fin as string);
        return {
          id: r.id,
          numero: r.numero_garantia || 'Garantía',
          projectId: r.project_id,
          projectName: r.projects?.name || 'Proyecto',
          vencimiento: r.vigencia_fin as string,
          daysLeft,
          expired: daysLeft < 0,
        };
      })
      .filter((a) => a.daysLeft <= limit)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [rows, settings.garantiasDays]);

  return { alerts, count: alerts.length, thresholdDays: settings.garantiasDays };
};
