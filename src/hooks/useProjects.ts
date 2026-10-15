
import { useState, useEffect } from "react";
import { Project } from "@/types/project";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { fetchProjectsFromDatabase, createProjectInDatabase, updateProjectInDatabase } from "@/api/projectsApi";
import { fetchMonthlyEstimations, saveMonthlyEstimations } from "@/api/monthlyEstimationsApi";
import { devError, devLog } from '@/utils/secureLogger';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch all projects from database (no user filtering)
  const fetchProjects = async () => {
    try {
      devLog('Fetching all projects from database');
      const transformedProjects = await fetchProjectsFromDatabase();
      
      // Fetch monthly estimations for each project
      const projectsWithEstimations = await Promise.all(
        transformedProjects.map(async (project) => {
          try {
            const estimations = await fetchMonthlyEstimations(project.id);
            return { ...project, monthlyEstimations: estimations };
          } catch (error) {
            devError(`Error fetching estimations for project ${project.id}:`, error);
            return { ...project, monthlyEstimations: [] };
          }
        })
      );
      
      devLog('Fetched projects with estimations:', projectsWithEstimations);
      setProjects(projectsWithEstimations);
    } catch (error) {
      devError('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load projects when component mounts
  useEffect(() => {
    fetchProjects();
  }, []);

  const addProject = async (projectData: Omit<Project, 'id'>) => {
    if (!user) {
      devError('No user found when trying to add project');
      return;
    }

    try {
      devLog('Adding project:', projectData);
      const newProject = await createProjectInDatabase(projectData, user.id);
      devLog('Created project:', newProject);
      
      // Save monthly estimations if they exist
      if (projectData.monthlyEstimations && projectData.monthlyEstimations.length > 0) {
        await saveMonthlyEstimations(newProject.id, projectData.monthlyEstimations);
        newProject.monthlyEstimations = projectData.monthlyEstimations;
      }
      
      setProjects(prev => [newProject, ...prev]);
      
      toast({
        title: "Success",
        description: "Project created successfully"
      });
    } catch (error) {
      devError('Error adding project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    }
  };

  const updateProject = async (projectId: string, projectData: Omit<Project, 'id'>) => {
    if (!user) {
      devError('No user found when trying to update project');
      return;
    }

    try {
      devLog('Updating project:', projectId, projectData);
      const updatedProject = await updateProjectInDatabase(projectId, projectData, user.id);
      devLog('Updated project:', updatedProject);
      
      // Save monthly estimations
      if (projectData.monthlyEstimations) {
        await saveMonthlyEstimations(projectId, projectData.monthlyEstimations);
        updatedProject.monthlyEstimations = projectData.monthlyEstimations;
      }
      
      setProjects(prev => prev.map(p => 
        p.id === projectId ? updatedProject : p
      ));
      
      toast({
        title: "Success",
        description: "Project updated successfully"
      });
    } catch (error) {
      devError('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive"
      });
    }
  };

  const saveProject = async (projectData: Omit<Project, 'id'>, existingProject?: Project | null) => {
    devLog('Saving project:', projectData, 'existing:', existingProject);
    if (existingProject) {
      await updateProject(existingProject.id, projectData);
    } else {
      await addProject(projectData);
    }
  };

  return {
    projects,
    loading,
    saveProject
  };
};
