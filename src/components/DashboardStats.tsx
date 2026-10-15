import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calendar, DollarSign, TrendingUp, CheckCircle, ClipboardList } from "lucide-react";
import { Project } from "@/types/project";
import { getExchangeRate, formatCurrency, convertToLempiras } from "@/utils/currencyUtils";
import { useMemo } from "react";
import { useHnlUsdRate } from "@/hooks/useHnlUsdRate";

interface DashboardStatsProps {
  projects: Project[];
  activeStatus?: string | null;
  onStatusFilter?: (status: string | null) => void;
}

const CLICKABLE = "cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all";
const ACTIVE_RING = "ring-2 ring-offset-2 ring-primary shadow-lg";

const DashboardStats = ({ projects, activeStatus = null, onStatusFilter }: DashboardStatsProps) => {
  const toggle = (status: string | null) => {
    if (!onStatusFilter) return;
    onStatusFilter(status && activeStatus === status ? null : status);
  };

  const { rate: hnlPerUsd } = useHnlUsdRate();

  const stats = useMemo(() => {
    const inProgress = projects.filter(p => p.status === "In Progress");
    const totalContractValueHNL = inProgress.reduce(
      (sum, p) => sum + (p.finalAmountHnl ?? p.financial?.contractAmount ?? 0),
      0
    );
    const totalContractValue = hnlPerUsd > 0 ? totalContractValueHNL / hnlPerUsd : 0;
    const activeProjects = inProgress.length;
    const completedProjects = projects.filter(p => p.status === "Completed").length;
    const planningProjects = projects.filter(p => p.status === "Planning").length;

    return {
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      planningProjects,
      totalContractValue,
      totalContractValueHNL,
    };
  }, [projects, hnlPerUsd]);

  return (
    <div className="mb-8">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-foreground">Resumen Ejecutivo</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">
        {/* 1. Planificación */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => toggle("Planning")}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle("Planning")}
          className={`${CLICKABLE} border-l-4 border-l-serpic-blue-500 bg-card lg:col-span-1 ${activeStatus === "Planning" ? ACTIVE_RING : ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-serpic-blue-700">En Planificación</CardTitle>
            <ClipboardList className="h-5 w-5 text-serpic-blue-500" />
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-serpic-blue-700 mb-1">{stats.planningProjects}</div>
            <p className="text-xs text-muted-foreground">Por iniciar</p>
          </CardContent>
        </Card>

        {/* 2. En Progreso */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => toggle("In Progress")}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle("In Progress")}
          className={`${CLICKABLE} border-l-4 border-l-green-500 bg-card lg:col-span-1 ${activeStatus === "In Progress" ? ACTIVE_RING : ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">En Progreso</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.activeProjects}</div>
            <p className="text-xs text-green-600">Activos</p>
          </CardContent>
        </Card>

        {/* 3. Finalizados */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => toggle("Completed")}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle("Completed")}
          className={`${CLICKABLE} border-l-4 border-l-purple-500 bg-card lg:col-span-1 ${activeStatus === "Completed" ? ACTIVE_RING : ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Finalizados</CardTitle>
            <CheckCircle className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">{stats.completedProjects}</div>
            <p className="text-xs text-purple-600">Completados</p>
          </CardContent>
        </Card>

        {/* 4. Total */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => onStatusFilter?.(null)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onStatusFilter?.(null)}
          className={`${CLICKABLE} border-l-4 border-l-muted-foreground bg-card lg:col-span-1 ${!activeStatus ? ACTIVE_RING : ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Proyectos</CardTitle>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-foreground mb-1">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Registrados</p>
          </CardContent>
        </Card>

        {/* 5. Valor Total (ancho) */}
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-serpic-blue-600 bg-card sm:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-serpic-blue-700">Valor Total según contratos En Progreso</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1 whitespace-nowrap tabular-nums overflow-hidden">
              {formatCurrency(stats.totalContractValueHNL, 'HNL')}
            </div>

            <div className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
              {formatCurrency(stats.totalContractValue, 'USD')}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Tasa del día: L {hnlPerUsd.toFixed(2)} / $
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
