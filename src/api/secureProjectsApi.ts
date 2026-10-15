
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { transformDatabaseToProject, transformProjectToDatabase } from "@/utils/projectTransforms";
import { validateProjectName, validateAmount, validateDate, validateEmail, validatePhone, sanitizeInput } from "@/utils/inputValidation";
import type { Database } from "@/integrations/supabase/types";
import { projectRateLimiter } from "@/utils/securityUtils";

/** Client-side throttle for write operations (defense in depth alongside RLS). */
const assertWriteAllowed = (key: string) => {
  if (!projectRateLimiter.isAllowed(key)) {
    throw new Error("Demasiadas operaciones seguidas. Espere un momento e intente de nuevo.");
  }
};
import { devError } from '@/utils/secureLogger';

type DbProject = Database['public']['Tables']['projects']['Row'];

const validateProjectData = (projectData: Omit<Project, 'id'>): string[] => {
  const errors: string[] = [];

  if (!validateProjectName(projectData.name)) {
    errors.push('Project name must be between 2 and 100 characters');
  }

  if (!projectData.client?.trim()) {
    errors.push('Client name is required');
  }

  return errors;
};


// Lightweight column list used for the dashboard list — EXCLUDES the heavy
// `photos` JSONB (which also stores nested subcontratos, gastos, costoDinamico,
// addendums, change orders, etc.) and the long `activities_description` text.
// Including those in the dashboard list caused multi-megabyte responses and
// PostgREST/RLS timeouts. The full record is fetched on demand by id.
const LIST_COLUMNS =
  'id,name,client,client_contact_name,client_email,client_phone,' +
  'project_manager_name,project_manager_email,project_manager_phone,' +
  'start_date,finish_date,estimated_completion,contract_amount,' +
  'monthly_expenses,project_type,work_type,performance_bond,payment_bond,' +
  'general_liability,workers_comp,status,notes,contract_number,consortium,' +
  'resident_name,initial_amount,initial_term_days,start_order_date,' +
  'construction_m2,final_reception_date,final_term_days,' +
  'final_duration_months,execution_year,final_amount_hnl,' +
  'project_exchange_rate,final_amount_usd,created_at,updated_at,user_id';

export const fetchProjectsFromDatabase = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(LIST_COLUMNS)
      .order('start_order_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      devError('Database error fetching projects:', error);
      throw new Error('Failed to fetch projects from database');
    }

    if (!data) {
      return [];
    }

    return data.map(transformDatabaseToProject);
  } catch (error) {
    devError('Error in fetchProjectsFromDatabase:', error);
    throw new Error('An unexpected error occurred while fetching projects');
  }
};

export const fetchProjectByIdFromDatabase = async (projectId: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (error) {
    devError('Database error fetching project by id:', error);
    throw new Error('Failed to fetch project');
  }
  if (!data) return null;
  return transformDatabaseToProject(data);
};


export const createProjectInDatabase = async (projectData: Omit<Project, 'id'>, userId: string): Promise<Project> => {
  try {
    // Validate input data
    assertWriteAllowed(`project_write_${userId}`);

    const validationErrors = validateProjectData(projectData);
    if (validationErrors.length > 0) {
      throw new Error('Revise los datos del proyecto: hay campos obligatorios inválidos.');
    }

    // Sanitize string inputs
    const sanitizedData = {
      ...projectData,
      name: sanitizeInput(projectData.name),
      client: sanitizeInput(projectData.client),
      notes: projectData.notes ? sanitizeInput(projectData.notes) : '',
      projectManager: {
        ...projectData.projectManager,
        name: sanitizeInput(projectData.projectManager.name),
        email: sanitizeInput(projectData.projectManager.email.toLowerCase()),
        phone: sanitizeInput(projectData.projectManager.phone)
      }
    };

    const dbData = transformProjectToDatabase(sanitizedData, userId);
    
    const { data, error } = await supabase
      .from('projects')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      devError('Database error creating project:', error);
      throw new Error('Failed to create project in database');
    }

    return transformDatabaseToProject(data);
  } catch (error) {
    devError('Error in createProjectInDatabase:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while creating the project');
  }
};

export const updateProjectInDatabase = async (projectId: string, projectData: Omit<Project, 'id'>, userId: string): Promise<Project> => {
  try {
    // Validate input data
    assertWriteAllowed(`project_write_${userId}`);

    const validationErrors = validateProjectData(projectData);
    if (validationErrors.length > 0) {
      throw new Error('Revise los datos del proyecto: hay campos obligatorios inválidos.');
    }

    // Sanitize string inputs
    const sanitizedData = {
      ...projectData,
      name: sanitizeInput(projectData.name),
      client: sanitizeInput(projectData.client),
      notes: projectData.notes ? sanitizeInput(projectData.notes) : '',
      projectManager: {
        ...projectData.projectManager,
        name: sanitizeInput(projectData.projectManager.name),
        email: sanitizeInput(projectData.projectManager.email.toLowerCase()),
        phone: sanitizeInput(projectData.projectManager.phone)
      }
    };

    const dbData = transformProjectToDatabase(sanitizedData, userId);
    
    const { data, error } = await supabase
      .from('projects')
      .update(dbData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      devError('Database error updating project:', error);
      throw new Error('Failed to update project in database');
    }

    return transformDatabaseToProject(data);
  } catch (error) {
    devError('Error in updateProjectInDatabase:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while updating the project');
  }
};

export const deleteProjectFromDatabase = async (projectId: string): Promise<void> => {
  assertWriteAllowed(`project_delete_${projectId}`);
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) {
    devError('Database error deleting project:', error);
    throw new Error('Failed to delete project');
  }
};
