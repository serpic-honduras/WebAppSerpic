import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Project } from "@/types/project";
import { PROJECT_COLUMNS, ColumnDef } from "./projectColumns";

const pickCols = (visibleKeys: string[]): ColumnDef[] =>
  PROJECT_COLUMNS.filter((c) => visibleKeys.includes(c.key));

export const exportProjectsToExcel = (projects: Project[], visibleKeys: string[]) => {
  const cols = pickCols(visibleKeys);
  const rows = projects.map((p) => {
    const row: Record<string, any> = {};
    for (const c of cols) {
      row[c.label] = c.raw ? c.raw(p) : c.value(p);
    }
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows, { header: cols.map((c) => c.label) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Proyectos");
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `proyectos-${date}.xlsx`);
};

export const exportProjectsToPdf = (projects: Project[], visibleKeys: string[]) => {
  const cols = pickCols(visibleKeys);
  const orientation = cols.length > 5 ? "landscape" : "portrait";
  const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text("Proyectos SERPIC", 40, 40);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString("es-HN")}`, 40, 56);

  autoTable(doc, {
    startY: 70,
    head: [cols.map((c) => c.label)],
    body: projects.map((p) => cols.map((c) => c.value(p))),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [120, 30, 30], textColor: 255 },
    columnStyles: cols.reduce((acc, c, i) => {
      acc[i] = { halign: c.align };
      return acc;
    }, {} as Record<number, any>),
  });

  const date = new Date().toISOString().slice(0, 10);
  doc.save(`proyectos-${date}.pdf`);
};
