
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useSecureProjects } from "@/hooks/useSecureProjects";
import { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ProjectForm from "@/components/ProjectForm";
import HeaderActions from "@/components/HeaderActions";

const NewProject = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSecureAuth();
  const { saveProject } = useSecureProjects();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <img 
            src="/lovable-uploads/logo-transparent.png" 
            alt="SERPIC Logo" 
            className="h-10 sm:h-12 lg:h-16 w-auto mx-auto mb-4"
          />
          <p className="text-sm sm:text-base text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const handleSaveProject = async (projectData: Omit<Project, 'id'>) => {
    await saveProject(projectData);
    navigate("/");
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
              <img 
                src="/lovable-uploads/logo-transparent.png" 
                alt="SERPIC Logo" 
                className="h-8 sm:h-10 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">SERPIC</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Nuevo Proyecto</p>
              </div>
            </div>
            <HeaderActions />
          </div>
        </div>
      </header>

      {/* Form Content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
        <ProjectForm
          onSubmit={handleSaveProject}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default NewProject;
