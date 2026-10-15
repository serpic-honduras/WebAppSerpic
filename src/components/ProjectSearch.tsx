
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ProjectSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const ProjectSearch = ({ searchTerm, onSearchChange }: ProjectSearchProps) => {
  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar proyectos, clientes o gestores de proyecto..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
};

export default ProjectSearch;
