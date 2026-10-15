
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { transformDatabaseToProject, transformProjectToDatabase } from "@/utils/projectTransforms";
import type { Database } from "@/integrations/supabase/types";

// Use the actual database row type from Supabase
type DbProject = Database['public']['Tables']['projects']['Row'];

export const fetchProjectsFromDatabase = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('start_order_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('No se pudieron cargar los proyectos.');
  }

  return data.map(transformDatabaseToProject);
};

export const createProjectInDatabase = async (projectData: Omit<Project, 'id'>, userId: string): Promise<Project> => {
  const dbData = transformProjectToDatabase(projectData, userId);
  
  const { data, error } = await supabase
    .from('projects')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    throw new Error('No se pudo completar la operación.');
  }

  return transformDatabaseToProject(data);
};

export const updateProjectInDatabase = async (projectId: string, projectData: Omit<Project, 'id'>, userId: string): Promise<Project> => {
  const dbData = transformProjectToDatabase(projectData, userId);
  
  const { data, error } = await supabase
    .from('projects')
    .update(dbData)
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error('No se pudo completar la operación.');
  }

  return transformDatabaseToProject(data);
};
