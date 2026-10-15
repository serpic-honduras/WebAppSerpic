
import { useRef } from "react";
import { Project } from "@/types/project";
import ProjectForm from "@/components/ProjectForm";

interface ProjectViewModalProps {
  project: Project;
  showForm: boolean;
  onSubmit: (projectData: Omit<Project, 'id'>) => Promise<void>;
  onCancel: () => void;
}

const ProjectViewModal = ({ project, showForm, onSubmit, onCancel }: ProjectViewModalProps) => {
  const formRef = useRef<HTMLDivElement>(null);

  if (!showForm) return null;

  return (
    <div ref={formRef} className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 overflow-y-auto z-50">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl my-8">
        <ProjectForm
          project={project}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
};

export default ProjectViewModal;
