import * as XLSX from "xlsx";
import {
  CostoDirectoProyecto,
  Estimacion,
  Gasto,
  Subcontrato,
  TipoGasto,
} from "@/types/project";

const HNL_FMT = '"L" #,##0.00';

type Row = (string | number)[];

const TIPO_TO_KEY: Record<TipoGasto, keyof CostoDirectoProyecto> = {
  "Costo Indirecto de Obra": "indirectosDeObra",
  Fianzas: "fianzas",
  Seguros: "seguros",
  Administración: "administracion",
  Escalatorias: "escalatoria",
  Imprevistos: "imprevistos",
  "Costo Directo": "costoDirecto",
  Financieros: "financieros",
};

const COST_LABELS: [keyof CostoDirectoProyecto, string][] = [
  ["costoDirecto", "Costo Directo"],
  ["indirectosDeObra", "Costo Indirecto de Obra"],
  ["fianzas", "Fianzas"],
  ["seguros", "Seguros"],
  ["administracion", "Administración"],
  ["escalatoria", "Escalatorias"],
  ["imprevistos", "Imprevistos"],
  ["financieros", "Financieros"],
];

const num = (v: any) => Number(v) || 0;

/** Builds a sheet, applies widths, currency format and bold totals rows. */
const addSheet = (
  wb: XLSX.WorkBook,
  name: string,
  headers: string[],
  rows: Row[],
  opts: { currencyCols?: number[]; totalRows?: number[] } = {},
) => {
  const aoa: Row[] = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const currencyCols = opts.currencyCols ?? [];
  const totalRows = new Set(opts.totalRows ?? []);

  ws["!cols"] = headers.map((h, c) => ({
    wch: Math.min(
      45,
      Math.max(14, h.length + 2, ...rows.map((r) => String(r[c] ?? "").length + 2)),
    ),
  }));

  // header styling + cell number formats
  for (let c = 0; c < headers.length; c++) {
    const hRef = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[hRef]) ws[hRef].s = { font: { bold: true } };
  }
  rows.forEach((row, i) => {
    const r = i + 1;
    for (let c = 0; c < headers.length; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      const cell = ws[ref];
      if (!cell) continue;
      if (currencyCols.includes(c) && typeof cell.v === "number") cell.z = HNL_FMT;
      if (totalRows.has(i)) cell.s = { font: { bold: true } };
    }
  });

  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
};

const dateStr = (d?: string) => (d ? new Date(d).toLocaleDateString("es-HN") : "");

export const exportProjectDossier = (p: any) => {
  const wb = XLSX.utils.book_new();

  const gastos: Gasto[] = p.gastos || [];
  const subcontratos: Subcontrato[] = p.subcontratos || [];
  const estimaciones: Estimacion[] = p.estimaciones || [];
  const anticipo = p.anticipo || null;
  const presupuestado: CostoDirectoProyecto = p.financial?.costoDirectoProyecto || ({} as any);

  /* ---------- Hoja 1: Información Básica ---------- */
  const finalUsd = num(p.finalAmountHnl) * num(p.projectExchangeRate);
  const basicRows: Row[] = [
    ["Nombre del Proyecto", p.name || ""],
    ["Número de Contrato", p.contractNumber || ""],
    ["Ubicación", p.location || ""],
    ["Consorcio", p.consortium || ""],
    ["Residente", p.residentName || ""],
    ["Tipo de Proyecto", p.workType || p.projectType || ""],
    ["Monto Inicial (L)", num(p.initialAmount)],
    ["Plazo Inicial (días)", num(p.initialTermDays)],
    ["Fecha Orden de Inicio", dateStr(p.startOrderDate)],
    ["Ente Contratante", p.client || ""],
    ["Teléfono del Cliente", p.clientContact?.phone || ""],
    ["Contacto", p.clientContact?.name || ""],
    ["Correo", p.clientContact?.email || ""],
    ["M² de Construcción", num(p.constructionM2)],
    ["Descripción de Actividades", p.activitiesDescription || ""],
    ["Fecha de Recepción Final", dateStr(p.finalReceptionDate)],
    ["Plazo Final (días)", num(p.finalTermDays)],
    ["Duración Final (meses)", num(p.finalDurationMonths)],
    ["Año de Ejecución", String(p.executionYear ?? "")],
    ["Monto Final (L)", num(p.finalAmountHnl)],
    ["Tasa de Cambio del Proyecto", num(p.projectExchangeRate)],
    ["Monto Final ($)", finalUsd],
    ["Estado del Proyecto", p.status || ""],
  ];
  addSheet(wb, "Información Básica", ["Campo", "Valor"], basicRows, { currencyCols: [] });

  /* ---------- Hoja 2: Costo Presupuestado ---------- */
  const presRows: Row[] = COST_LABELS.map(([k, label]) => [label, num(presupuestado[k])]);
  const subTotalPres = COST_LABELS.reduce((s, [k]) => s + num(presupuestado[k]), 0);
  const totalPres = subTotalPres + num(presupuestado.utilidad);
  presRows.push(["Sub-Total Costo", subTotalPres]);
  presRows.push(["Utilidad", num(presupuestado.utilidad)]);
  presRows.push(["Total Costo", totalPres]);
  presRows.push(["Monto de Proyecto - Total Costo", num(p.initialAmount) - totalPres]);
  addSheet(wb, "Costo Presupuestado", ["Partida", "Monto (L)"], presRows, {
    currencyCols: [1],
    totalRows: [presRows.length - 4, presRows.length - 2, presRows.length - 1],
  });

  /* ---------- Hoja 3: Costo Dinámico ---------- */
  const dyn: Partial<Record<keyof CostoDirectoProyecto, number>> = {};
  for (const g of gastos) {
    const key = TIPO_TO_KEY[g.tipoGasto];
    if (!key) continue;
    dyn[key] = (dyn[key] || 0) + num(g.montoPagado);
  }
  const totalBruto = estimaciones.reduce((s, e) => s + num(e.montoBruto), 0);
  const subTotalDyn = COST_LABELS.reduce((s, [k]) => s + num(dyn[k]), 0);
  const utilidadDyn = totalBruto - subTotalDyn;
  const dynRows: Row[] = COST_LABELS.map(([k, label]) => [label, num(dyn[k])]);
  dynRows.push(["Sub-Total Costo", subTotalDyn]);
  dynRows.push(["Utilidad (Bruto Estimaciones - Costos Ejecutados)", utilidadDyn]);
  dynRows.push(["Total Costo", subTotalDyn + utilidadDyn]);
  addSheet(wb, "Costo Dinámico", ["Partida", "Monto Ejecutado (L)"], dynRows, {
    currencyCols: [1],
    totalRows: [dynRows.length - 3, dynRows.length - 2, dynRows.length - 1],
  });

  /* ---------- Hoja 4: Anticipos ---------- */
  const anticipoMonto = num(anticipo?.monto);
  const retenido = estimaciones.reduce((s, e) => s + num(e.deduccionAnticipo), 0);
  const antRows: Row[] = [
    ["Monto de Anticipo", dateStr(anticipo?.fecha), anticipoMonto],
    ["Anticipo Amortizado (retenido en estimaciones)", "", retenido],
    ["Anticipo Restante", "", anticipoMonto - retenido],
  ];
  addSheet(wb, "Anticipos", ["Concepto", "Fecha", "Monto (L)"], antRows, {
    currencyCols: [2],
    totalRows: [2],
  });

  /* ---------- Hoja 5: Estimaciones ---------- */
  const estHeaders = [
    "N° Estimación",
    "Período",
    "Monto (L)",
    "Cláusulas Escalatorias (L)",
    "Administración Delegada (L)",
    "Monto Bruto (L)",
    "Deducción Anticipo (L)",
    "Deducción Calidad (L)",
    "Materiales Almacenados (L)",
    "Devolución Materiales (L)",
    "Monto Neto (L)",
    "Estatus",
  ];
  const estRows: Row[] = estimaciones.map((e) => [
    e.numero || "",
    `${dateStr(e.fechaInicio)} - ${dateStr(e.fechaFin)}`,
    num(e.monto),
    num(e.escalatorias),
    num(e.adminDelegada),
    num(e.montoBruto),
    num(e.deduccionAnticipo),
    num(e.deduccionCalidad),
    num(e.materialesAlmacenados),
    num(e.devolucionMaterialesAlmacenados),
    num(e.montoNeto),
    e.pagado ? "Pagada" : "No Pagada",
  ]);
  const sumEst = (f: (e: Estimacion) => number) => estimaciones.reduce((s, e) => s + f(e), 0);
  estRows.push([
    "TOTALES",
    "",
    sumEst((e) => num(e.monto)),
    sumEst((e) => num(e.escalatorias)),
    sumEst((e) => num(e.adminDelegada)),
    sumEst((e) => num(e.montoBruto)),
    sumEst((e) => num(e.deduccionAnticipo)),
    sumEst((e) => num(e.deduccionCalidad)),
    sumEst((e) => num(e.materialesAlmacenados)),
    sumEst((e) => num(e.devolucionMaterialesAlmacenados)),
    sumEst((e) => num(e.montoNeto)),
    "",
  ]);
  addSheet(wb, "Estimaciones", estHeaders, estRows, {
    currencyCols: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    totalRows: [estRows.length - 1],
  });

  /* ---------- Hoja 6: Subcontratos ---------- */
  const paidBySub = new Map<string, number>();
  for (const g of gastos) {
    paidBySub.set(g.subcontratistaId, (paidBySub.get(g.subcontratistaId) || 0) + num(g.montoPagado));
  }
  const subRows: Row[] = subcontratos.map((s) => {
    const pagado = paidBySub.get(s.id) || 0;
    return [
      s.nombre || s.empresa || "",
      s.descripcion || s.concepto || "",
      num(s.monto),
      pagado,
      num(s.monto) - pagado,
    ];
  });
  subRows.push([
    "TOTALES",
    "",
    subcontratos.reduce((s, x) => s + num(x.monto), 0),
    subcontratos.reduce((s, x) => s + (paidBySub.get(x.id) || 0), 0),
    subcontratos.reduce((s, x) => s + num(x.monto) - (paidBySub.get(x.id) || 0), 0),
  ]);
  addSheet(
    wb,
    "Subcontratos",
    ["Subcontratista", "Descripción", "Monto Contrato (L)", "Pagado (L)", "Saldo (L)"],
    subRows,
    { currencyCols: [2, 3, 4], totalRows: [subRows.length - 1] },
  );

  /* ---------- Hoja 7: Gastos ---------- */
  const subName = (id: string) =>
    subcontratos.find((s) => s.id === id)?.nombre ||
    subcontratos.find((s) => s.id === id)?.empresa ||
    "";
  const gastoRows: Row[] = gastos.map((g) => [
    dateStr(g.fecha),
    g.descripcion || "",
    subName(g.subcontratistaId),
    g.tipoGasto || "",
    g.subcategoriaCostoDirecto || "",
    num(g.montoPagado),
  ]);
  gastoRows.push([
    "TOTAL",
    "",
    "",
    "",
    "",
    gastos.reduce((s, g) => s + num(g.montoPagado), 0),
  ]);
  addSheet(
    wb,
    "Gastos",
    ["Fecha", "Descripción", "Subcontratista", "Tipo de Gasto", "Subcategoría", "Monto Pagado (L)"],
    gastoRows,
    { currencyCols: [5], totalRows: [gastoRows.length - 1] },
  );

  const safeName = String(p.name || "Proyecto").replace(/[^\p{L}\p{N}]+/gu, "_").slice(0, 60);
  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Expediente_${safeName}_${fecha}.xlsx`);
};
