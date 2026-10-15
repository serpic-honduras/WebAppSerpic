
import { useState, useCallback } from "react";
import { Project } from "@/types/project";
import { devLog } from '@/utils/secureLogger';

export const useProjectsState = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [estimationsLoading, setEstimationsLoading] = useState(false);
  const [projectsCache, setProjectsCache] = useState<Map<string, Project>>(new Map());

  const addProject = useCallback((newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    setProjectsCache(prev => new Map(prev.set(newProject.id, newProject)));
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prev => prev.map(p => 
      p.id === updatedProject.id ? updatedProject : p
    ));
    setProjectsCache(prev => new Map(prev.set(updatedProject.id, updatedProject)));
  }, []);

  const removeProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setProjectsCache(prev => {
      const next = new Map(prev);
      next.delete(projectId);
      return next;
    });
  }, []);

  const setProjectsWithCache = useCallback((projects: Project[]) => {
    setProjects(projects);
    const cacheMap = new Map();
    projects.forEach(project => {
      cacheMap.set(project.id, project);
    });
    setProjectsCache(cacheMap);
  }, []);

  const getProject = useCallback((projectId: string): Project | null => {
    devLog('Getting project with ID:', projectId);
    devLog('Available projects:', projects.length);
    devLog('Cache size:', projectsCache.size);
    
    // First try to get from cache
    const cachedProject = projectsCache.get(projectId);
    if (cachedProject) {
      devLog('Found project in cache:', cachedProject.name);
      return cachedProject;
    }
    
    // Then try to find in projects array
    const foundProject = projects.find(p => p.id === projectId);
    if (foundProject) {
      devLog('Found project in array:', foundProject.name);
      // Update cache with found project
      setProjectsCache(prev => new Map(prev.set(projectId, foundProject)));
      return foundProject;
    }
    
    devLog('Project not found anywhere');
    return null;
  }, [projectsCache, projects]);

  return {
    projects,
    loading,
    estimationsLoading,
    projectsCache,
    setLoading,
    setEstimationsLoading,
    addProject,
    updateProject,
    removeProject,
    setProjectsWithCache,
    getProject
  };
};
