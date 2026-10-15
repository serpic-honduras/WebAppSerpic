
import { Project } from "@/types/project";
import ProjectViewCards from "./ProjectViewCards";

interface ProjectViewContentProps {
  project: Project;
  exchangeRate: number;
}

const ProjectViewContent = ({ project, exchangeRate }: ProjectViewContentProps) => {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <ProjectViewCards project={project} exchangeRate={exchangeRate} />
      </div>
    </div>
  );
};

export default ProjectViewContent;
