import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardStats from "@/components/DashboardStats";
import ProjectSearch from "@/components/ProjectSearch";
import ProjectsGrid from "@/components/ProjectsGrid";
import ProjectsList from "@/components/ProjectsList";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, List, Columns3, Download, ChevronDown, FileSpreadsheet, FileText, Filter, Check, X } from "lucide-react";
import { useSecureProjects } from "@/hooks/useSecureProjects";
import { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { PROJECT_COLUMNS, DEFAULT_VISIBLE_KEYS } from "@/utils/projectColumns";
import { exportProjectsToExcel, exportProjectsToPdf } from "@/utils/projectExport";

const VISIBLE_COLS_KEY = "serpic_list_visible_cols_v1";
const FILTER_BY_KEY = "serpic_filter_by_v1";

type FilterByKey = "" | "workType" | "executionYear" | "client" | "status";

const FILTER_OPTIONS: { value: Exclude<FilterByKey, "">; label: string }[] = [
  { value: "workType", label: "Tipo de obra" },
  { value: "executionYear", label: "Año de ejecución" },
  { value: "client", label: "Nombre del Ente Contratante" },
  { value: "status", label: "Estado" },
];

const STATUS_LABELS: Record<string, string> = {
  "In Progress": "En Progreso",
  Planning: "Planificación",
  Completed: "Finalizado",
  "On Hold": "En Espera",
};


const Index = () => {
  const { user, loading: authLoading, isAuditor } = useSecureAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const navigate = useNavigate();

  const [visibleCols, setVisibleCols] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(VISIBLE_COLS_KEY);
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr) && arr.length) return arr.filter((k: string) => PROJECT_COLUMNS.some((c) => c.key === k));
      }
    } catch {}
    return DEFAULT_VISIBLE_KEYS;
  });

  useEffect(() => {
    localStorage.setItem(VISIBLE_COLS_KEY, JSON.stringify(visibleCols));
  }, [visibleCols]);

  const toggleCol = (key: string) =>
    setVisibleCols((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  // Dynamic combined filter
  const [filterBy, setFilterBy] = useState<FilterByKey>(() => {
    try {
      const v = localStorage.getItem(FILTER_BY_KEY) as FilterByKey | null;
      if (v && FILTER_OPTIONS.some((o) => o.value === v)) return v;
    } catch {}
    return "";
  });
  const [filterValue, setFilterValue] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(FILTER_BY_KEY, filterBy);
  }, [filterBy]);

  // Active status derived from the current filter (keeps KPI cards in sync).
  const activeStatus = useMemo(() => {
    if (filterBy !== "status" || !filterValue) return null;
    const entry = Object.entries(STATUS_LABELS).find(([, label]) => label === filterValue);
    return entry ? entry[0] : null;
  }, [filterBy, filterValue]);

  const handleStatusFilter = (status: string | null) => {
    if (!status) {
      setFilterValue("");
      return;
    }
    setFilterBy("status");
    setFilterValue(STATUS_LABELS[status] ?? status);
  };


  const { projects, loading: projectsLoading, estimationsLoading } = useSecureProjects();


  const getProjectFieldValue = (p: Project, key: Exclude<FilterByKey, "">): string => {
    switch (key) {
      case "workType":
        return (p.workType || p.projectType || "").trim();
      case "executionYear":
        return p.executionYear != null ? String(p.executionYear) : "";
      case "client":
        return (p.client || "").trim();
      case "status":
        return STATUS_LABELS[p.status] ?? p.status ?? "";
    }
  };

  const filterUniqueOptions = useMemo(() => {
    if (!filterBy) return [];
    const set = new Set<string>();
    for (const p of projects) {
      const v = getProjectFieldValue(p, filterBy);
      if (v) set.add(v);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [projects, filterBy]);

  // Memoized filtered projects to prevent unnecessary filtering on each render
  const filteredProjects = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const lowerFilterValue = filterValue.trim().toLowerCase();
    return projects.filter((project) => {
      if (searchTerm) {
        const matchesSearch =
          project.name.toLowerCase().includes(lowerSearchTerm) ||
          project.client.toLowerCase().includes(lowerSearchTerm) ||
          project.projectManager.name.toLowerCase().includes(lowerSearchTerm) ||
          project.projectType.toLowerCase().includes(lowerSearchTerm) ||
          project.location?.toLowerCase().includes(lowerSearchTerm);
        if (!matchesSearch) return false;
      }
      if (filterBy && lowerFilterValue) {
        const fieldVal = getProjectFieldValue(project, filterBy).toLowerCase();
        if (!fieldVal.includes(lowerFilterValue)) return false;
      }
      return true;
    });
  }, [projects, searchTerm, filterBy, filterValue]);


  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-serpic-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <img 
            src="/lovable-uploads/logo-transparent.png" 
            alt="SERPIC Logo" 
            className="h-10 sm:h-12 lg:h-16 w-auto mx-auto mb-4"
          />
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mx-auto mb-2"></div>
            <p className="text-sm sm:text-base text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleEditProject = (project: Project) => {
    // Navigation is now handled directly in the card components
  };

  const handleNewProject = () => {
    navigate("/new-project");
  };

  // Show loading state only for initial projects load (not for estimations)
  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-serpic-gradient">
        <DashboardHeader onNewProject={handleNewProject} />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-8">
          <div className="animate-pulse space-y-6">
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`bg-card p-6 rounded-lg shadow border-l-4 border-l-muted-foreground ${i === 4 ? "lg:col-span-2" : ""}`}>
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
            
            {/* Search skeleton */}
            <div className="h-10 bg-muted rounded w-full max-w-md mx-auto"></div>
            
            {/* Projects grid skeleton */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card p-6 rounded-lg shadow border-l-4 border-l-muted-foreground">
                  <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard view for authenticated users
  return (
    <div className="min-h-screen bg-serpic-gradient">
      <DashboardHeader onNewProject={handleNewProject} />

      <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-4 py-3 sm:py-4 lg:py-8">
        <DashboardStats projects={projects} activeStatus={activeStatus} onStatusFilter={handleStatusFilter} />
        
        
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-foreground">
                Historial de Proyectos ({filteredProjects.length})
              </h3>
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(v) => v && setViewMode(v as "grid" | "list")}
                size="sm"
                className="border border-border rounded-md"
              >
                <ToggleGroupItem value="grid" aria-label="Vista tarjetas" className="h-8 w-8 p-0">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="Vista lista" className="h-8 w-8 p-0">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              {viewMode === "list" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Columns3 className="h-4 w-4 mr-1" /> Columnas
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto bg-card z-50">
                    <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {PROJECT_COLUMNS.map((c) => (
                      <DropdownMenuCheckboxItem
                        key={c.key}
                        checked={visibleCols.includes(c.key)}
                        onCheckedChange={() => toggleCol(c.key)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {c.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Dynamic combined filter (visible in both list and kanban) */}
              <div className="flex items-center gap-2">
                <Select
                  value={filterBy || "__none__"}
                  onValueChange={(v) => {
                    setFilterBy(v === "__none__" ? "" : (v as FilterByKey));
                    setFilterValue("");
                  }}

                >
                  <SelectTrigger className="h-8 w-[180px]">
                    <div className="flex items-center gap-1 truncate">
                      <Filter className="h-4 w-4 shrink-0" />
                      <SelectValue placeholder="Filtrar por" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    <SelectItem value="__none__">Sin filtro</SelectItem>
                    {FILTER_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover open={filterOpen} onOpenChange={(o) => filterBy && setFilterOpen(o)}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      role="combobox"
                      disabled={!filterBy}
                      className={cn("h-8 w-[220px] justify-between font-normal", !filterValue && "text-muted-foreground")}
                    >
                      <span className="truncate">
                        {filterValue || (filterBy ? "Escribe o selecciona…" : "Selecciona un campo")}
                      </span>
                      <ChevronDown className="h-3 w-3 ml-1 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0 bg-card z-50" align="start">
                    <Command shouldFilter>
                      <CommandInput
                        placeholder="Buscar..."
                        value={filterValue}
                        onValueChange={setFilterValue}
                      />
                      <CommandList>
                        <CommandEmpty>Sin coincidencias</CommandEmpty>
                        <CommandGroup>
                          {filterUniqueOptions.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={(v) => {
                                setFilterValue(v);
                                setFilterOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", filterValue === opt ? "opacity-100" : "opacity-0")} />
                              {opt}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {filterValue && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setFilterValue("")}
                    aria-label="Limpiar filtro"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {viewMode === "list" && !isAuditor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="h-8 bg-slate-600 hover:bg-slate-700 text-white border border-slate-700"
                    >
                      <Download className="h-4 w-4 mr-1" /> Exportar
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card z-50">
                    <DropdownMenuItem onClick={() => exportProjectsToExcel(filteredProjects, visibleCols)}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar como Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportProjectsToPdf(filteredProjects, visibleCols)}>
                      <FileText className="h-4 w-4 mr-2" /> Exportar como PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="w-full sm:w-auto sm:max-w-md">
              <ProjectSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            </div>
          </div>
        </div>
        
        {viewMode === "grid" ? (
          <ProjectsGrid 
            projects={filteredProjects}
            searchTerm={searchTerm}
            onEditProject={handleEditProject}
            onNewProject={handleNewProject}
          />
        ) : (
          <ProjectsList projects={filteredProjects} searchTerm={searchTerm} visibleKeys={visibleCols} />
        )}
      </div>
    </div>
  );
};

export default Index;
