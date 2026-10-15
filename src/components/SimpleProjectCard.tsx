import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Settings as SettingsIcon } from "lucide-react";
import { Project } from "@/types/project";
import ClientContactSection from "@/components/project-card/ClientContactSection";
import { useNavigate } from "react-router-dom";
import { memo, useMemo, useCallback } from "react";

interface SimpleProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
}

const SimpleProjectCard = memo(({ project }: SimpleProjectCardProps) => {
  const navigate = useNavigate();

  const statusColor = useMemo(() => {
    switch (project.status) {
      case 'In Progress': return 'bg-green-100 text-green-800 border-green-200';
      case 'Planning': return 'bg-serpic-blue-100 text-serpic-blue-800 border-serpic-blue-200';
      case 'Completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-muted text-foreground border-border';
    }
  }, [project.status]);

  const statusText = useMemo(() => {
    switch (project.status) {
      case 'In Progress': return 'En Progreso';
      case 'Planning': return 'Planificación';
      case 'Completed': return 'Completado';
      case 'On Hold': return 'En Espera';
      default: return project.status;
    }
  }, [project.status]);

  const handleManage = useCallback(() => navigate(`/project/${project.id}`), [navigate, project.id]);
  const handleSummary = useCallback(() => navigate(`/project/${project.id}/summary`), [navigate, project.id]);

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary h-fit bg-card min-w-0 overflow-hidden">
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="flex-1 min-w-0 text-base font-bold text-foreground leading-tight break-words line-clamp-2" title={project.name}>
              {project.name}
            </CardTitle>
            <Badge className={`${statusColor} text-xs shrink-0 whitespace-nowrap border`}>
              {statusText}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground font-medium truncate" title={project.projectType}>
            {project.projectType}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4">
        <div className="bg-muted p-3 rounded-lg border border-border min-w-0">
          <ClientContactSection client={project.client} clientContact={project.clientContact} />
        </div>

        {project.location && (
          <div className="text-sm truncate" title={project.location}>{project.location}</div>
        )}

        <div className="flex flex-row gap-2 w-full pt-3 border-t border-border">
          <Button size="sm" onClick={handleManage} className="flex-1 min-w-0 h-9 bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium px-2 py-1.5">
            <SettingsIcon className="h-4 w-4 mr-1 shrink-0" />
            <span className="whitespace-nowrap">Gestionar</span>
          </Button>
          <Button size="sm" onClick={handleSummary} className="flex-1 min-w-0 h-9 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-2 py-1.5">
            <FileText className="h-4 w-4 mr-1 shrink-0" />
            <span className="whitespace-nowrap">Resumen BI</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
SimpleProjectCard.displayName = 'SimpleProjectCard';
export default SimpleProjectCard;
