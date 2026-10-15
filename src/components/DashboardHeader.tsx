
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeaderActions from "@/components/HeaderActions";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useSecureAuth } from "@/hooks/useSecureAuth";

interface DashboardHeaderProps {
  onNewProject?: () => void;
}

const DashboardHeader = ({ onNewProject }: DashboardHeaderProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isAuditor, can } = useSecureAuth();
  const canCreate = !isAuditor && can('projects.edit');

  const handleNewProject = () => {
    navigate("/new-project");
  };

  return (
    <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <img 
              src="/lovable-uploads/logo-transparent.png" 
              alt="SERPIC Logo" 
              className="h-8 sm:h-10 w-auto shrink-0"
            />
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground font-medium truncate">
              Sistema de Gestión de Proyectos
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {canCreate && (
              <Button 
                onClick={handleNewProject}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                size={isMobile ? "sm" : "default"}
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                {isMobile ? "Nuevo" : "Nuevo Proyecto"}
              </Button>
            )}
            
            <HeaderActions />

          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
