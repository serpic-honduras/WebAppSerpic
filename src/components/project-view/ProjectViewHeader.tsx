
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit } from "lucide-react";
import { Project } from "@/types/project";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProjectViewHeaderProps {
  project: Project;
  onEditClick: () => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

const ProjectViewHeader = ({ 
  project, 
  onEditClick, 
  getStatusColor, 
  getStatusText 
}: ProjectViewHeaderProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={() => navigate('/')}
              className="shrink-0 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
              {isMobile ? "Volver" : "Dashboard"}
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                {project.name}
              </h1>
              <p className="text-sm text-muted-foreground truncate">
                Cliente: {project.client}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Badge className={`${getStatusColor(project.status)} text-xs sm:text-sm whitespace-nowrap border`}>
              {getStatusText(project.status)}
            </Badge>
            <Button
              onClick={onEditClick}
              size={isMobile ? "sm" : "default"}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 shadow-md hover:shadow-lg transition-all"
            >
              <Edit className="h-4 w-4 mr-1 sm:mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectViewHeader;
