
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SimpleProjectCard from "@/components/SimpleProjectCard";
import { Project } from "@/types/project";

interface ProjectsGridProps {
  projects: Project[];
  searchTerm: string;
  onEditProject: (project: Project) => void;
  onNewProject: () => void;
}

const ProjectsGrid = ({ projects, searchTerm, onEditProject, onNewProject }: ProjectsGridProps) => {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <Building2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm sm:text-base font-semibold text-foreground">No se encontraron proyectos</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
          {searchTerm ? "Intenta ajustar tus términos de búsqueda." : "Comienza creando un nuevo proyecto."}
        </p>
        {!searchTerm && (
          <div className="mt-6">
            <Button onClick={() => navigate("/new-project")} size="sm" className="sm:text-base">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
      {projects.map((project) => (
        <SimpleProjectCard
          key={project.id}
          project={project}
          onEdit={onEditProject}
        />
      ))}
    </div>
  );
};

export default ProjectsGrid;
