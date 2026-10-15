import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuth } from "@/hooks/useSecureAuth";

// Column order for export / import template
const COLUMNS: Array<{ header: string; key: string }> = [
  { header: "Nombre del Proyecto", key: "name" },
  { header: "Número de Contrato", key: "contract_number" },
  { header: "Ubicación", key: "location" },
  { header: "Consorcio", key: "consortium" },
  { header: "Tipo de Obra", key: "work_type" },
  { header: "Monto Inicial", key: "initial_amount" },
  { header: "Plazo Inicial (días)", key: "initial_term_days" },
  { header: "Fecha Orden de Inicio", key: "start_order_date" },
  { header: "Ente Contratante", key: "client" },
  { header: "Teléfono del Cliente", key: "client_phone" },
  { header: "Contacto", key: "client_contact_name" },
  { header: "Correo", key: "client_email" },
  { header: "M2 de Construcción", key: "construction_m2" },
  { header: "Descripción de Actividades", key: "activities_description" },
  { header: "Fecha Recepción Final", key: "final_reception_date" },
  { header: "Plazo Final (días)", key: "final_term_days" },
  { header: "Duración Final (meses)", key: "final_duration_months" },
  { header: "Año de Ejecución", key: "execution_year" },
  { header: "Monto Final L", key: "final_amount_hnl" },
  { header: "Tasa de Cambio", key: "project_exchange_rate" },
  { header: "Monto Final $", key: "final_amount_usd" },
  { header: "Estado", key: "status" },
];

const parseDate = (v: any): string | null => {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

const num = (v: any) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};

const normalizeStatus = (raw: any): "Planning" | "In Progress" | "Completed" | "On Hold" => {
  if (!raw) return "Planning";
  const s = String(raw).trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // strip accents
  if (/(finaliz|complet|terminad|cerrad|finished|done|entregad)/.test(s)) return "Completed";
  if (/(progreso|ejecu|in progress|activ|curso|marcha)/.test(s)) return "In Progress";
  if (/(espera|hold|pausad|suspend|detenid)/.test(s)) return "On Hold";
  if (/(planific|planning|por iniciar|pendiente|inicial)/.test(s)) return "Planning";
  // Accept already-normalized English values
  if (s === "completed") return "Completed";
  if (s === "in progress") return "In Progress";
  if (s === "on hold") return "On Hold";
  return "Planning";
};

const DatabaseManager = () => {
  const { toast } = useToast();
  const { user } = useSecureAuth();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data || []).map((p: any) => {
        const row: Record<string, any> = {};
        for (const c of COLUMNS) row[c.header] = p[c.key] ?? "";
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(rows, { header: COLUMNS.map((c) => c.header) });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Proyectos");
      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `proyectos-historial-${date}.xlsx`);
      toast({ title: "Exportación lista", description: `${rows.length} proyecto(s) descargados.` });
    } catch (e: any) {
      toast({ title: "Error al exportar", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([], { header: COLUMNS.map((c) => c.header) });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "plantilla-proyectos.xlsx");
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleLoadData = async () => {
    if (!selectedFile || !user) return;
    setImporting(true);
    try {
      const buf = await selectedFile.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: null });

      let created = 0;
      let failed = 0;

      for (const r of rows) {
        const get = (header: string) => {
          const v = r[header];
          return v === undefined || v === null || v === "" ? null : v;
        };
        const name = get("Nombre del Proyecto");
        if (!name) continue;

        const hnl = num(get("Monto Final L")) ?? 0;
        const rate = num(get("Tasa de Cambio")) ?? 0;
        const usd = num(get("Monto Final $")) ?? (rate > 0 ? hnl * rate : 0);
        const initialAmt = num(get("Monto Inicial")) ?? 0;

        const insertRow: any = {
          user_id: user.id,
          name: String(name),
          client: get("Ente Contratante") ? String(get("Ente Contratante")) : (get("Cliente") ? String(get("Cliente")) : ""),
          status: normalizeStatus(get("Estado")),
          contract_amount: initialAmt,
          monthly_expenses: 0,
          performance_bond: 0,
          payment_bond: 0,
          general_liability: 0,
          workers_comp: 0,
          photos: {},

          contract_number: get("Número de Contrato"),
          consortium: get("Consorcio"),
          work_type: get("Tipo de Obra"),
          project_type: get("Tipo de Obra") || "",
          initial_amount: num(get("Monto Inicial")),
          initial_term_days: num(get("Plazo Inicial (días)")),
          start_order_date: parseDate(get("Fecha Orden de Inicio")),
          client_phone: get("Teléfono del Cliente"),
          client_contact_name: get("Contacto"),
          client_email: get("Correo"),
          construction_m2: num(get("M2 de Construcción")),
          activities_description: get("Descripción de Actividades"),
          final_reception_date: parseDate(get("Fecha Recepción Final")),
          final_term_days: num(get("Plazo Final (días)")),
          final_duration_months: num(get("Duración Final (meses)")),
          execution_year: num(get("Año de Ejecución")),
          final_amount_hnl: hnl,
          project_exchange_rate: rate,
          final_amount_usd: usd,
        };

        const { error } = await supabase.from("projects").insert(insertRow);
        if (error) {
          failed++;
        } else {
          created++;
        }
      }

      toast({
        title: "Los datos han sido cargados con éxito",
        description: `Creados: ${created}${failed ? ` · Fallidos: ${failed}` : ""}`,
      });
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      // Refresh dashboard to reflect new rows
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      toast({ title: "Error al importar", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4 text-left">
      <Card>
        <CardHeader className="text-left">
          <CardTitle className="flex items-center gap-2 text-left">
            <Upload className="h-5 w-5" /> Cargar Historial Masivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-left">
          <p className="text-sm text-muted-foreground">
            Sube un archivo de Excel (.xlsx o .xls). Los campos vacíos son permitidos.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Descargar plantilla
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleSelectFile}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
              <Upload className="h-4 w-4 mr-2" />
              {selectedFile ? "Cambiar archivo" : "Seleccionar archivo"}
            </Button>
            {selectedFile && (
              <>
                <span className="text-sm text-muted-foreground truncate max-w-[240px]">
                  {selectedFile.name}
                </span>
                <Button onClick={handleLoadData} disabled={importing}>
                  {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  {importing ? "Cargando..." : "Cargar datos"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-left">
          <CardTitle className="flex items-center gap-2 text-left">
            <Download className="h-5 w-5" /> Descargar Historial Masivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-left">
          <p className="text-sm text-muted-foreground">
            Exporta todos los proyectos visibles a un archivo Excel con la estructura completa de campos.
          </p>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {exporting ? "Generando..." : "Descargar Excel"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseManager;
