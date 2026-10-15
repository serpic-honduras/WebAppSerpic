
import { Project } from "@/types/project";
import { fetchProjectsFromDatabase, createProjectInDatabase, updateProjectInDatabase, deleteProjectFromDatabase } from "@/api/secureProjectsApi";
import { fetchMonthlyEstimations, saveMonthlyEstimations } from "@/api/secureMonthlyEstimationsApi";
import { devError, devLog } from '@/utils/secureLogger';

export class ProjectsService {
  static async fetchAllProjects(): Promise<Project[]> {
    devLog('Starting to fetch projects from database');
    return await fetchProjectsFromDatabase();
  }

  static async fetchProjectsWithEstimations(projects: Project[]): Promise<Project[]> {
    if (projects.length === 0) return projects;

    const batchSize = 3;
    const batches = [];
    for (let i = 0; i < projects.length; i += batchSize) {
      batches.push(projects.slice(i, i + batchSize));
    }

    const updatedProjects = [...projects];

    for (const batch of batches) {
      const batchPromises = batch.map(async (project) => {
        try {
          const estimations = await fetchMonthlyEstimations(project.id);
          return { ...project, monthlyEstimations: estimations };
        } catch (error) {
          devError(`Error fetching estimations for project ${project.id}:`, error);
          return { ...project, monthlyEstimations: [] };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(updatedProject => {
        const index = updatedProjects.findIndex(p => p.id === updatedProject.id);
        if (index !== -1) {
          updatedProjects[index] = updatedProject;
        }
      });

      // Small delay between batches to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return updatedProjects;
  }

  static async createProject(projectData: Omit<Project, 'id'>, userId: string): Promise<Project> {
    devLog('Adding project:', projectData.name);
    const newProject = await createProjectInDatabase(projectData, userId);
    devLog('Created project:', newProject.id);
    
    // Save monthly estimations if they exist
    if (projectData.monthlyEstimations && projectData.monthlyEstimations.length > 0) {
      await saveMonthlyEstimations(newProject.id, projectData.monthlyEstimations);
      newProject.monthlyEstimations = projectData.monthlyEstimations;
    }
    
    return newProject;
  }

  static async updateProject(projectId: string, projectData: Omit<Project, 'id'>, userId: string): Promise<Project> {
    devLog('Updating project:', projectId);
    const updatedProject = await updateProjectInDatabase(projectId, projectData, userId);
    devLog('Updated project:', updatedProject.id);
    
    // Save monthly estimations
    if (projectData.monthlyEstimations) {
      await saveMonthlyEstimations(projectId, projectData.monthlyEstimations);
      updatedProject.monthlyEstimations = projectData.monthlyEstimations;
    }
    
    return updatedProject;
  }

  static async deleteProject(projectId: string): Promise<void> {
    await deleteProjectFromDatabase(projectId);
  }
}
