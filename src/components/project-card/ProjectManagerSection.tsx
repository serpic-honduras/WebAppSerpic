
import { User, Mail, Phone } from "lucide-react";
import { ProjectManager } from "@/types/project";

interface ProjectManagerSectionProps {
  projectManager: ProjectManager;
}

const ProjectManagerSection = ({ projectManager }: ProjectManagerSectionProps) => {
  return (
    <div className="bg-muted p-4 rounded-lg">
      <div className="flex items-center space-x-2 text-base font-semibold mb-3">
        <User className="h-5 w-5 text-primary" />
        <span>Gestor de Proyecto</span>
      </div>
      <div className="space-y-3 text-sm">
        <div className="font-medium break-words">{projectManager.name}</div>
        <div className="flex items-start space-x-2">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <span className="break-words">{projectManager.email}</span>
        </div>
        <div className="flex items-start space-x-2">
          <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <span className="break-words">{projectManager.phone}</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectManagerSection;
