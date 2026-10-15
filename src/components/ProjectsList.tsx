import { Project } from "@/types/project";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { PROJECT_COLUMNS } from "@/utils/projectColumns";

interface ProjectsListProps {
  projects: Project[];
  searchTerm: string;
  visibleKeys: string[];
}

const statusClass: Record<string, string> = {
  "In Progress": "bg-green-100 text-green-800 border-green-200",
  Planning: "bg-serpic-blue-100 text-serpic-blue-800 border-serpic-blue-200",
  Completed: "bg-purple-100 text-purple-800 border-purple-200",
  "On Hold": "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const alignClass = (a: "left" | "right" | "center") =>
  a === "left" ? "text-left" : a === "right" ? "text-right" : "text-center";

const ProjectsList = ({ projects, searchTerm, visibleKeys }: ProjectsListProps) => {
  const navigate = useNavigate();

  const cols = useMemo(
    () => PROJECT_COLUMNS.filter((c) => visibleKeys.includes(c.key)),
    [visibleKeys]
  );

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-card rounded-lg border border-border">
        <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-foreground">No se encontraron proyectos</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {searchTerm ? "Intenta ajustar tus términos de búsqueda." : "Comienza creando un nuevo proyecto."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              {cols.map((c) => (
                <TableHead key={c.key} className="text-center">
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow
                key={p.id}
                className="cursor-pointer hover:bg-muted"
                onClick={() => navigate(`/project/${p.id}`)}
              >
                {cols.map((c) => {
                  const base = `${alignClass(c.align)} ${c.align === "right" ? "whitespace-nowrap tabular-nums" : ""}`;
                  if (c.key === "status") {
                    return (
                      <TableCell key={c.key} className={base}>
                        <Badge className={`${statusClass[p.status] ?? "bg-muted text-foreground border-border"} border text-xs`}>
                          {c.value(p)}
                        </Badge>
                      </TableCell>
                    );
                  }
                  if (c.key === "name") {
                    return (
                      <TableCell key={c.key} className={`${base} font-medium text-foreground`}>
                        {c.value(p)}
                      </TableCell>
                    );
                  }
                  return (
                    <TableCell key={c.key} className={base}>
                      {c.value(p)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProjectsList;
