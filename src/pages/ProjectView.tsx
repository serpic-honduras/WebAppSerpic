import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Project } from "@/types/project";
import { useSecureProjects } from "@/hooks/useSecureProjects";
import { fetchProjectByIdFromDatabase } from "@/api/secureProjectsApi";
import ProjectForm from "@/components/ProjectForm";
import HeaderActions from "@/components/HeaderActions";
import { devError } from '@/utils/secureLogger';

const ProjectView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { saveProject } = useSecureProjects();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetchProjectByIdFromDatabase(id)
      .then((p) => {
        if (cancelled) return;
        if (!p) setNotFound(true);
        else setProject(p);
      })
      .catch((err) => {
        devError('Error loading project:', err);
        if (!cancelled) setNotFound(true);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen serpic-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <img
            src="/lovable-uploads/logo-transparent.png"
            alt="SERPIC Logo"
            className="h-10 sm:h-12 lg:h-16 w-auto mx-auto mb-4"
          />
          <p className="text-sm sm:text-base text-muted-foreground">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen serpic-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Proyecto no encontrado</h1>
          <p className="text-muted-foreground mb-6">El proyecto que buscas no existe o no tienes permisos para verlo.</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-muted-foreground bg-card hover:bg-muted"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProject = async (projectData: Omit<Project, 'id'>) => {
    await saveProject(projectData, project);
  };

  const handleCancel = () => navigate('/');

  return (
    <div className="min-h-screen serpic-gradient">
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img
                src="/lovable-uploads/logo-transparent.png"
                alt="SERPIC Logo"
                className="h-8 sm:h-10 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">SERPIC</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Proyecto: {project?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                ← Dashboard
              </button>
              <HeaderActions />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ProjectForm
          project={project}
          onSubmit={handleSaveProject}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default ProjectView;
