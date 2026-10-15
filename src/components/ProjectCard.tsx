
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, Edit, Camera, MapPin, Eye } from "lucide-react";
import { Project } from "@/types/project";
import { getExchangeRate, formatNumber } from "@/utils/currencyUtils";
import ClientContactSection from "@/components/project-card/ClientContactSection";
import ProjectManagerSection from "@/components/project-card/ProjectManagerSection";
import TimelineSection from "@/components/project-card/TimelineSection";
import FinancialSection from "@/components/project-card/FinancialSection";
import BondsSection from "@/components/project-card/BondsSection";
import InsuranceSection from "@/components/project-card/InsuranceSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
}

const ProjectCard = ({ project, onEdit }: ProjectCardProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-green-100 text-green-800';
      case 'Planning':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-muted text-foreground';
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'En Progreso';
      case 'Planning':
        return 'Planificación';
      case 'Completed':
        return 'Completado';
      case 'On Hold':
        return 'En Espera';
      default:
        return status;
    }
  };

  // Get the latest photo
  const getLatestPhoto = () => {
    if (!project.photos || project.photos.length === 0) return null;
    return project.photos.sort((a, b) => 
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    )[0];
  };

  const latestPhoto = getLatestPhoto();

  // Get exchange rate for project start date (only used for display purposes)
  const exchangeRate = getExchangeRate(project.startDate);

  const handleViewProject = () => {
    navigate(`/project/${project.id}`);
  };

  const handleEditClick = () => {
    navigate(`/project/${project.id}?edit=true`);
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 h-fit">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <CardTitle className="text-lg sm:text-xl font-bold text-foreground leading-tight break-words">
              {project.name}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-foreground font-medium break-words">
              Cliente: {project.client}
            </CardDescription>
          </div>
          <Badge className={`${getStatusColor(project.status)} text-xs sm:text-sm shrink-0 whitespace-nowrap self-start`}>
            {getStatusText(project.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 px-4 sm:px-6 pb-4">
        <div className="space-y-5">
          <ClientContactSection 
            client={project.client} 
            clientContact={project.clientContact} 
          />

          <ProjectManagerSection projectManager={project.projectManager} />

          {/* Project Type */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-start space-x-3 text-sm sm:text-base">
              <Building className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <span className="font-medium block mb-1">Tipo de Proyecto:</span>
                <span className="text-sm break-words">{project.projectType}</span>
              </div>
            </div>
          </div>

          <TimelineSection 
            startDate={project.startDate}
            finishDate={project.finishDate}
            estimatedCompletion={project.estimatedCompletion}
          />

          <FinancialSection 
            financial={project.financial} 
            currency={project.currency}
            notes={project.notes}
          />

          <BondsSection 
            bonds={project.bonds} 
            exchangeRate={exchangeRate}
            currency={project.currency}
            projectStartDate={project.startDate}
          />

          <InsuranceSection 
            insurance={project.insurance} 
            exchangeRate={exchangeRate}
            currency={project.currency}
            projectStartDate={project.startDate}
          />

          {/* Latest Project Photo */}
          {latestPhoto && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-sm sm:text-base font-semibold mb-4">
                <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <span>Última Foto del Proyecto</span>
              </div>
              <div className="space-y-3">
                <img 
                  src={latestPhoto.url} 
                  alt={latestPhoto.caption || 'Foto del proyecto'} 
                  className="w-full h-40 sm:h-48 object-cover rounded-lg border"
                />
                {latestPhoto.caption && (
                  <p className="text-sm text-muted-foreground font-medium break-words leading-relaxed">{latestPhoto.caption}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Subida el: {new Date(latestPhoto.uploadDate).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          )}

          {/* Exchange Rate Info - Only show for multi-currency context */}
          {project.currency !== 'HNL' && (
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg flex items-center">
              <MapPin className="h-3 w-3 mr-2 shrink-0" />
              <span>Tipo de cambio: L {formatNumber(exchangeRate)} / {project.currency} (referencia)</span>
            </div>
          )}
        </div>

        {/* Photos and Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border gap-3">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Camera className="h-4 w-4 shrink-0" />
            <span>{project.photos?.length || 0} fotos</span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm"
              onClick={handleViewProject}
              className="bg-slate-600 hover:bg-slate-700 text-white shrink-0 text-xs sm:text-sm px-3"
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
            
            <Button 
              size="sm"
              onClick={handleEditClick}
              className="bg-amber-500 hover:bg-amber-600 text-white shrink-0 text-xs sm:text-sm px-3"
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
