
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useProjectsFetch } from "@/hooks/useProjectsFetch";
import { useProjectsActions } from "@/hooks/useProjectsActions";

export const useSecureProjects = () => {
  const { user, loading: authLoading } = useSecureAuth();
  const { projects: fetchedProjects, loading, estimationsLoading, fetchProjects } = useProjectsFetch();
  const { saveProject, deleteProject: rawDelete } = useProjectsActions();

  // Optimistic layer: hide deleted rows immediately without a full refetch.
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Load projects once auth is settled and user is present.
  useEffect(() => {
    if (authLoading || !user) return;
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  const projects = useMemo(
    () => (deletedIds.size ? fetchedProjects.filter(p => !deletedIds.has(p.id)) : fetchedProjects),
    [fetchedProjects, deletedIds],
  );

  const getProject = useCallback(
    (projectId: string) => projects.find(p => p.id === projectId) || null,
    [projects],
  );

  const deleteProject = useCallback(async (projectId: string) => {
    // Optimistically remove from UI.
    setDeletedIds(prev => {
      const next = new Set(prev);
      next.add(projectId);
      return next;
    });
    const ok = await rawDelete(projectId);
    if (!ok) {
      // Roll back if the server rejected the delete.
      setDeletedIds(prev => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
    return ok;
  }, [rawDelete]);

  return {
    projects,
    loading,
    estimationsLoading,
    saveProject,
    deleteProject,
    refreshProjects: fetchProjects,
    getProject,
  };
};
