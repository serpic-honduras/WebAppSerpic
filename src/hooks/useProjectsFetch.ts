
import { useCallback } from "react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useToast } from "@/hooks/use-toast";
import { ProjectsService } from "@/services/projectsService";
import { useProjectsState } from "@/hooks/useProjectsState";
import { devError } from '@/utils/secureLogger';

export const useProjectsFetch = () => {
  const { user, loading: authLoading } = useSecureAuth();
  const { toast } = useToast();
  const {
    projects,
    loading,
    setLoading,
    setProjectsWithCache,
  } = useProjectsState();

  const fetchProjects = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const transformedProjects = await ProjectsService.fetchAllProjects();

      // Render projects immediately; monthly estimations are loaded on-demand
      // inside the project form, not in the dashboard list.
      const projectsList = transformedProjects.map(project => ({
        ...project,
        monthlyEstimations: [],
      }));

      setProjectsWithCache(projectsList);
    } catch (error) {
      devError('Error fetching projects:', error);
      if (error instanceof Error && !error.message.includes('auth')) {
        toast({
          title: "Error",
          description: "Failed to load projects. Please try refreshing the page.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast, user, authLoading, setLoading, setProjectsWithCache]);

  return {
    projects,
    loading,
    estimationsLoading: false,
    fetchProjects
  };
};
