
import React, { useState } from 'react';
import { Project } from '@/types/project';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProjectFormTabs from './project-form/ProjectFormTabs';
import { useProjectForm } from '@/hooks/useProjectForm';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { devError } from '@/utils/secureLogger';

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (project: Omit<Project, 'id'>) => Promise<void>;
  onCancel: () => void;
}

const ProjectForm = ({ project, onSubmit, onCancel }: ProjectFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSignal, setSavedSignal] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [presupuestadoEditing, setPresupuestadoEditing] = useState(false);
  // These tabs persist each record instantly, so a global save bar is confusing.
  const hideActionBar = activeTab === 'subcontratos' || activeTab === 'gastos' || activeTab === 'anticipos' || activeTab === 'estimaciones' || activeTab === 'garantias';
  const { toast } = useToast();
  const { isAuditor, can } = useSecureAuth();
  const canSave = !isAuditor && (can('projects.edit') || can('costs.edit'));
  const canEditCosts = !isAuditor && can('costs.edit');

  const {
    formData,
    monthlyEstimations,
    handleInputChange,
    handleMonthlyExpensesChange,
    handleEstimationsChange
  } = useProjectForm(project);

  // Immediate persistence used by sub-sections (e.g. expense registry) that
  // must hit the database without the user pressing the global "Guardar".
  const handleAutoSave = async (overrides: Partial<Omit<Project, 'id'>>) => {
    const { id: _id, ...fd } = formData as any;
    await onSubmit({ ...fd, monthlyEstimations, ...overrides } as Omit<Project, 'id'>);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { id: _id, ...fd } = formData as any;
      const projectData: Omit<Project, 'id'> = {
        ...fd,
        monthlyEstimations
      };

      await onSubmit(projectData);
      // Signal tabs to auto-lock after a successful save.
      setSavedSignal((n) => n + 1);
    } catch (error) {
      devError('guardar proyecto', error);
      toast({
        title: "Error",
        description: "Error al guardar el proyecto. Por favor, verifica todos los campos.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{project ? 'Editar Proyecto' : 'Nuevo Proyecto'}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectFormTabs
            formData={formData}
            monthlyEstimations={monthlyEstimations}
            onInputChange={handleInputChange}
            onMonthlyExpensesChange={handleMonthlyExpensesChange}
            onEstimationsChange={handleEstimationsChange}
            storageKey={project?.id || 'new'}
            savedSignal={savedSignal}
            onAutoSave={handleAutoSave}
            onActiveTabChange={setActiveTab}
            presupuestadoEditing={presupuestadoEditing}
            onPresupuestadoEditingChange={setPresupuestadoEditing}
          />

          {!hideActionBar && (
          <div className="flex gap-4 pt-6">
            {activeTab === 'presupuestado' && canEditCosts && (
              <Button
                type="button"
                variant={presupuestadoEditing ? 'outline' : 'default'}
                onClick={() => setPresupuestadoEditing((v) => !v)}
              >
                {presupuestadoEditing ? 'Bloquear Edición' : 'Editar'}
              </Button>
            )}
            {canSave && (
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Guardando...'
                  : (project ? 'Guardar' : 'Crear Proyecto')
                }
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {canSave ? 'Cancelar' : 'Volver'}
            </Button>
          </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
};

export default ProjectForm;
