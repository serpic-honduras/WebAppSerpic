import * as XLSX from "xlsx";
import type { Estimacion, Gasto, Subcontrato, TipoGasto } from "@/types/project";

const normalizeStatus = (v: string) => {
  const n = v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/final|complet|termin|conclu/.test(n)) return "Completed";
  if (/progres|ejecuc|curso/.test(n)) return "In Progress";
  return "Planning";
};

export class DossierImportError extends Error {}

const uid = () => crypto.randomUUID();

/** "L 11,239,457.75" / "$0.00" / 123 -> number */
export const toNumber = (v: any): number => {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (v == null) return 0;
  const s = String(v).replace(/[^0-9.\-]/g, "");
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
};

/** DD/MM/YYYY (also M/D/YYYY when unambiguous), ISO, or Excel serial -> YYYY-MM-DD */
export const toIsoDate = (v: any): string => {
  if (v == null || v === "") return "";
  if (v instanceof Date) return isNaN(v.getTime()) ? "" : v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    return d ? `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}` : "";
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (!m) return "";
  let a = +m[1], b = +m[2];
  let y = +m[3];
  if (y < 100) y += 2000;
  // Default DD/MM; swap when first part can only be a month
  let day = a, month = b;
  if (b > 12 && a <= 12) { day = b; month = a; }
  if (month < 1 || month > 12 || day < 1 || day > 31) return "";
  return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const norm = (s: any) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

const isSkipRow = (first: any) => {
  const n = norm(first);
  return !n || n === "totales" || n === "total";
};

const findSheet = (wb: XLSX.WorkBook, ...names: string[]) => {
  const wanted = names.map(norm);
  const name = wb.SheetNames.find((s) => wanted.includes(norm(s)));
  return name ? wb.Sheets[name] : undefined;
};

const rowsOf = (ws: XLSX.WorkSheet) =>
  XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: true, defval: "" }).slice(1);

const BASIC_MAP: Record<string, { field: string; type: "text" | "number" | "date" | "status" | "year" }> = {
  "nombre del proyecto": { field: "name", type: "text" },
  "numero de contrato": { field: "contractNumber", type: "text" },
  "ubicacion": { field: "location", type: "text" },
  "consorcio": { field: "consortium", type: "text" },
  "residente": { field: "residentName", type: "text" },
  "tipo de proyecto": { field: "workType", type: "text" },
  "tipo de obra": { field: "workType", type: "text" },
  "monto inicial (l)": { field: "initialAmount", type: "number" },
  "plazo inicial (dias)": { field: "initialTermDays", type: "number" },
  "fecha orden de inicio": { field: "startOrderDate", type: "date" },
  "ente contratante": { field: "client", type: "text" },
  "telefono del cliente": { field: "clientContact.phone", type: "text" },
  "contacto": { field: "clientContact.name", type: "text" },
  "correo": { field: "clientContact.email", type: "text" },
  "m² de construccion": { field: "constructionM2", type: "number" },
  "m2 de construccion": { field: "constructionM2", type: "number" },
  "descripcion de actividades": { field: "activitiesDescription", type: "text" },
  "fecha de recepcion final": { field: "finalReceptionDate", type: "date" },
  "plazo final (dias)": { field: "finalTermDays", type: "number" },
  "duracion final (meses)": { field: "finalDurationMonths", type: "number" },
  "ano de ejecucion": { field: "executionYear", type: "year" },
  "monto final (l)": { field: "finalAmountHnl", type: "number" },
  "tasa de cambio del proyecto": { field: "projectExchangeRate", type: "number" },
  "estado del proyecto": { field: "status", type: "status" },
};

const COST_MAP: Record<string, string> = {
  "costo directo": "costoDirecto",
  "costo indirecto de obra": "indirectosDeObra",
  "indirecto": "indirectosDeObra",
  "indirectos de obra": "indirectosDeObra",
  "fianzas": "fianzas",
  "seguros": "seguros",
  "administracion": "administracion",
  "escalatorias": "escalatoria",
  "imprevistos": "imprevistos",
  "financieros": "financieros",
  "utilidad": "utilidad",
};

const TIPOS: TipoGasto[] = [
  "Costo Indirecto de Obra", "Fianzas", "Seguros", "Administración",
  "Escalatorias", "Imprevistos", "Financieros", "Costo Directo",
];

export type DossierPatch = Record<string, any>;

/** Parses an exported dossier workbook into form-field updates. */
export const parseProjectDossier = async (file: File, current: any): Promise<DossierPatch> => {
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  } catch {
    throw new DossierImportError("No se pudo leer el archivo. Verifique que sea un Excel válido (.xlsx / .xls).");
  }
  const patch: DossierPatch = {};
  let row = 0;
  let sheet = "";
  const fail = (msg: string): never => {
    throw new DossierImportError(`Pestaña "${sheet}", fila ${row + 2}: ${msg}`);
  };

  try {
    /* Información Básica */
    sheet = "Información Básica";
    const basic = findSheet(wb, sheet);
    if (basic) {
      const contact = { ...(current.clientContact || {}) };
      rowsOf(basic).forEach((r, i) => {
        row = i;
        const def = BASIC_MAP[norm(r[0])];
        if (!def) return;
        const v = r[1];
        let value: any;
        if (def.type === "number") value = toNumber(v);
        else if (def.type === "date") value = toIsoDate(v) || undefined;
        else if (def.type === "year") value = v === "" ? undefined : Math.trunc(toNumber(v)) || undefined;
        else if (def.type === "status") value = v ? normalizeStatus(String(v)) : undefined;
        else value = String(v ?? "").trim();
        if (value === undefined) return;
        if (def.field.startsWith("clientContact.")) contact[def.field.split(".")[1]] = value;
        else patch[def.field] = value;
      });
      patch.clientContact = contact;
    }

    /* Costo Presupuestado */
    sheet = "Costo Presupuestado";
    const pres = findSheet(wb, sheet, "Costos");
    if (pres) {
      const costo: Record<string, number> = { ...(current.financial?.costoDirectoProyecto || {}) };
      rowsOf(pres).forEach((r, i) => {
        row = i;
        const key = COST_MAP[norm(r[0])];
        if (key) costo[key] = toNumber(r[1]);
      });
      patch["financial.costoDirectoProyecto"] = costo;
    }

    /* Anticipos */
    sheet = "Anticipos";
    const ant = findSheet(wb, sheet);
    if (ant) {
      rowsOf(ant).forEach((r, i) => {
        row = i;
        if (norm(r[0]).startsWith("monto de anticipo")) {
          patch.anticipo = { monto: toNumber(r[2]), fecha: toIsoDate(r[1]) };
        }
      });
    }

    /* Estimaciones */
    sheet = "Estimaciones";
    const est = findSheet(wb, sheet);
    if (est) {
      const existing: Estimacion[] = current.estimaciones || [];
      const list: Estimacion[] = [];
      rowsOf(est).forEach((r, i) => {
        row = i;
        if (isSkipRow(r[0])) return;
        const numero = String(r[0]).trim();
        const [ini = "", fin = ""] = String(r[1] ?? "").split(/\s+-\s+/);
        const e: Estimacion = {
          id: existing.find((x) => norm(x.numero) === norm(numero))?.id || uid(),
          numero,
          fechaInicio: toIsoDate(ini.trim()),
          fechaFin: toIsoDate(fin.trim()),
          monto: toNumber(r[2]),
          escalatorias: toNumber(r[3]),
          adminDelegada: toNumber(r[4]),
          montoBruto: toNumber(r[5]),
          deduccionAnticipo: toNumber(r[6]),
          deduccionCalidad: toNumber(r[7]),
          materialesAlmacenados: toNumber(r[8]),
          devolucionMaterialesAlmacenados: toNumber(r[9]),
          montoNeto: toNumber(r[10]),
          pagado: norm(r[11]) === "pagada" || norm(r[11]) === "pagado",
        };
        if (!e.montoBruto) e.montoBruto = e.monto + e.escalatorias + e.adminDelegada;
        list.push(e);
      });
      patch.estimaciones = list;
    }

    /* Subcontratos */
    sheet = "Subcontratos";
    const sub = findSheet(wb, sheet);
    const subcontratos: Subcontrato[] = [...(current.subcontratos || [])];
    if (sub) {
      rowsOf(sub).forEach((r, i) => {
        row = i;
        if (isSkipRow(r[0])) return;
        const nombre = String(r[0]).trim();
        const found = subcontratos.find((s) => norm(s.nombre || s.empresa) === norm(nombre));
        if (found) {
          found.descripcion = String(r[1] ?? "").trim() || found.descripcion;
          found.monto = toNumber(r[2]);
        } else {
          subcontratos.push({ id: uid(), nombre, descripcion: String(r[1] ?? "").trim(), monto: toNumber(r[2]) });
        }
      });
    }

    /* Gastos */
    sheet = "Gastos";
    const gas = findSheet(wb, sheet);
    if (gas) {
      const list: Gasto[] = [];
      rowsOf(gas).forEach((r, i) => {
        row = i;
        if (isSkipRow(r[0]) && isSkipRow(r[1])) return;
        if (isSkipRow(r[0]) && norm(r[0]).startsWith("total")) return;
        const tipo = TIPOS.find((t) => norm(t) === norm(r[3]));
        if (!tipo) fail(`Tipo de Gasto "${r[3]}" no reconocido.`);
        const subName = String(r[2] ?? "").trim();
        let subId = "";
        if (subName) {
          let s = subcontratos.find((x) => norm(x.nombre || x.empresa) === norm(subName));
          if (!s) {
            s = { id: uid(), nombre: subName, descripcion: "", monto: 0 };
            subcontratos.push(s);
          }
          subId = s.id;
        }
        list.push({
          id: uid(),
          fecha: toIsoDate(r[0]),
          descripcion: String(r[1] ?? "").trim(),
          subcontratistaId: subId,
          tipoGasto: tipo!,
          subcategoriaCostoDirecto: (String(r[4] ?? "").trim() || undefined) as any,
          montoPagado: toNumber(r[5]),
        });
      });
      patch.gastos = list;
    }
    if (sub || gas) patch.subcontratos = subcontratos;
  } catch (e) {
    if (e instanceof DossierImportError) throw e;
    fail((e as Error).message || "Error desconocido");
  }

  if (!Object.keys(patch).length) {
    throw new DossierImportError("El archivo no contiene ninguna pestaña reconocida del expediente.");
  }
  return patch;
};
