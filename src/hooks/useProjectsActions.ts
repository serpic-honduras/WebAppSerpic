
import { useCallback } from "react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@/types/project";
import { ProjectsService } from "@/services/projectsService";
import { useProjectsState } from "@/hooks/useProjectsState";
import { devError, devLog, toFriendlyMessage } from '@/utils/secureLogger';

export const useProjectsActions = () => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const { addProject: addProjectToState, updateProject: updateProjectInState } = useProjectsState();

  const addProject = useCallback(async (projectData: Omit<Project, 'id'>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create projects",
        variant: "destructive"
      });
      return;
    }

    try {
      const newProject = await ProjectsService.createProject(projectData, user.id);
      addProjectToState(newProject);
      
      toast({
        title: "Success",
        description: "Project created successfully"
      });
    } catch (error) {
      devError('Error adding project:', error);
      toast({
        title: "Error",
        description: toFriendlyMessage(error, 'save'),
        variant: "destructive"
      });
    }
  }, [user, toast, addProjectToState]);

  const updateProject = useCallback(async (projectId: string, projectData: Omit<Project, 'id'>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update projects",
        variant: "destructive"
      });
      return;
    }

    try {
      const updatedProject = await ProjectsService.updateProject(projectId, projectData, user.id);
      updateProjectInState(updatedProject);
      
      toast({
        title: "Success",
        description: "Project updated successfully"
      });
    } catch (error) {
      devError('Error updating project:', error);
      toast({
        title: "Error",
        description: toFriendlyMessage(error, 'save'),
        variant: "destructive"
      });
    }
  }, [user, toast, updateProjectInState]);

  const saveProject = useCallback(async (projectData: Omit<Project, 'id'>, existingProject?: Project | null) => {
    devLog('Saving project:', projectData.name);
    if (existingProject) {
      await updateProject(existingProject.id, projectData);
    } else {
      await addProject(projectData);
    }
  }, [addProject, updateProject]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!user) {
      toast({ title: "Error", description: "Debes iniciar sesión", variant: "destructive" });
      return false;
    }
    try {
      await ProjectsService.deleteProject(projectId);
      toast({ title: "Proyecto eliminado", description: "El proyecto se ha eliminado correctamente" });
      return true;
    } catch (error) {
      devError('Error deleting project:', error);
      toast({
        title: "Error",
        description: toFriendlyMessage(error, 'save'),
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast]);

  return {
    saveProject,
    deleteProject,
  };
};
