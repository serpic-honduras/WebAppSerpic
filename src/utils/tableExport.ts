import * as XLSX from "xlsx";

/**
 * Exports an array of plain objects to a formatted .xlsx file.
 * Keys of the first row define the column order/headers.
 */
export const exportRowsToExcel = (
  rows: Record<string, string | number>[],
  sheetName: string,
  fileBase: string,
) => {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  ws["!cols"] = headers.map((h) => ({
    wch: Math.min(
      40,
      Math.max(12, h.length + 2, ...rows.map((r) => String(r[h] ?? "").length + 2)),
    ),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileBase}-${date}.xlsx`);
};
