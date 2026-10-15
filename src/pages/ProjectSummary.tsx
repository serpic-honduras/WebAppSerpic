import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Project, CostoDirectoProyecto, TipoGasto } from "@/types/project";
import { fetchProjectByIdFromDatabase } from "@/api/secureProjectsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, TrendingUp, Wallet, Scale, ShieldAlert, Target,
  AlertTriangle, Lightbulb, Activity, CheckCircle2, Percent, Receipt,
  Banknote, FileText, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { devError } from '@/utils/secureLogger';
import { consolidatedCosto } from '@/utils/budgetModifications';
import HeaderActions from '@/components/HeaderActions';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, LabelList,
} from "recharts";


const EMPTY_COSTO: CostoDirectoProyecto = {
  costoDirecto: 0, indirectosDeObra: 0, fianzas: 0, seguros: 0,
  administracion: 0, escalatoria: 0, imprevistos: 0, financieros: 0, utilidad: 0,
};

const ROWS: { key: keyof CostoDirectoProyecto; label: string; short: string }[] = [
  { key: 'costoDirecto', label: 'Costo Directo', short: 'Directo' },
  { key: 'indirectosDeObra', label: 'Costo Indirecto de Obra', short: 'Indirecto' },
  { key: 'fianzas', label: 'Fianzas', short: 'Fianzas' },
  { key: 'seguros', label: 'Seguros', short: 'Seguros' },
  { key: 'administracion', label: 'Administración', short: 'Admin.' },
  { key: 'escalatoria', label: 'Escalatorias', short: 'Escalat.' },
  { key: 'imprevistos', label: 'Imprevistos', short: 'Imprev.' },
  { key: 'financieros', label: 'Financieros', short: 'Financ.' },
  { key: 'utilidad', label: 'Utilidad', short: 'Utilidad' },
];

const TIPO_TO_KEY: Record<TipoGasto, keyof CostoDirectoProyecto> = {
  'Costo Indirecto de Obra': 'indirectosDeObra',
  'Fianzas': 'fianzas',
  'Seguros': 'seguros',
  'Administración': 'administracion',
  'Escalatorias': 'escalatoria',
  'Imprevistos': 'imprevistos',
  'Financieros': 'financieros',
  'Costo Directo': 'costoDirecto',
};

const PIE_COLORS = [
  'hsl(var(--primary))', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6',
  '#ec4899', '#64748b', '#14b8a6', '#ef4444',
];

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (n: number) =>
  Math.abs(n) >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
  Math.abs(n) >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : `${n}`;

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-');
  const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${names[Number(m) - 1] || m} ${String(y).slice(2)}`;
};

type Insight = { kind: 'alert' | 'tip' | 'ok'; title: string; detail: string };

const ProjectSummary = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    fetchProjectByIdFromDatabase(id)
      .then((p) => { if (!cancelled) setProject(p); })
      .catch((err) => { devError('Error loading project summary:', err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const presupuestado = useMemo(
    () =>
      consolidatedCosto(
        (project?.financial?.costoDirectoProyecto || EMPTY_COSTO) as any,
        project?.budgetModifications || [],
      ),
    [project?.financial?.costoDirectoProyecto, project?.budgetModifications],
  );
  const montoAmpliadoTotal = useMemo(
    () =>
      (project?.budgetModifications || []).reduce(
        (s, m) => s + (Number(m?.montoAmpliado) || 0),
        0,
      ),
    [project?.budgetModifications],
  );
  const gastos = project?.gastos;
  const subcontratos = project?.subcontratos;
  const estimaciones = project?.estimaciones;

  const bi = useMemo(() => {
    const dyn: Record<string, number> = {
      costoDirecto: 0, indirectosDeObra: 0, fianzas: 0, seguros: 0,
      administracion: 0, escalatoria: 0, imprevistos: 0, financieros: 0,
      utilidad: 0,
    };
    const byMonth: Record<string, number> = {};
    const bySub: Record<string, number> = {};
    let materiales = 0;
    let planilla = 0;

    for (const g of gastos || []) {
      const amount = Number(g.montoPagado) || 0;
      const k = TIPO_TO_KEY[g.tipoGasto];
      if (k) dyn[k as string] += amount;
      const ym = (g.fecha || '').slice(0, 7);
      if (ym) byMonth[ym] = (byMonth[ym] || 0) + amount;
      const subName =
        (subcontratos || []).find((s) => s.id === g.subcontratistaId)?.nombre || 'Sin subcontratista';
      bySub[subName] = (bySub[subName] || 0) + amount;
      if (g.subcategoriaCostoDirecto === 'Materiales') materiales += amount;
      if (g.subcategoriaCostoDirecto === 'Planilla') planilla += amount;
    }

    // Utilidad dinámica = Total Monto Bruto de Estimaciones - suma de los 8 costos dinámicos
    const COST_KEYS = [
      'costoDirecto', 'indirectosDeObra', 'fianzas', 'seguros',
      'administracion', 'escalatoria', 'imprevistos', 'financieros',
    ];
    const totalBruto = (estimaciones || []).reduce((s, e) => s + (Number(e.montoBruto) || 0), 0);
    const utilidadDinamica = totalBruto - COST_KEYS.reduce((s, k) => s + (dyn[k] || 0), 0);
    dyn.utilidad = utilidadDinamica;

    const pTotal = ROWS.reduce((s, r) => s + (Number(presupuestado[r.key]) || 0), 0);
    const dTotal = ROWS.reduce((s, r) => s + (dyn[r.key as string] || 0), 0);

    const chartData = ROWS.map((r) => ({
      name: r.short,
      Presupuestado: Number(presupuestado[r.key]) || 0,
      Dinámico: dyn[r.key as string] || 0,
    }));

    const pieData = ROWS
      .map((r) => ({ name: r.label, value: dyn[r.key as string] || 0 }))
      .filter((e) => e.value > 0);

    const months = Object.keys(byMonth).sort();
    let acc = 0;
    const burnData = months.map((m) => {
      acc += byMonth[m];
      return { name: monthLabel(m), Mensual: byMonth[m], Acumulado: acc };
    });

    const totalSub = Object.values(bySub).reduce((s, v) => s + v, 0);
    const subData = Object.entries(bySub)
      .map(([name, value]) => ({
        name,
        value,
        porcentaje: totalSub > 0 ? (value / totalSub) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // ---- Progreso de tiempo ----
    const start = project?.startOrderDate || project?.startDate;
    const end = project?.finalReceptionDate || project?.finishDate || project?.estimatedCompletion;
    let timePct: number | null = null;
    if (start && end) {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      const now = Date.now();
      if (e > s) timePct = Math.max(0, Math.min(100, ((now - s) / (e - s)) * 100));
    }
    const costPct = pTotal > 0 ? (dTotal / pTotal) * 100 : 0;

    // ---- Semáforo de riesgo ----
    let risk: { level: 'Bajo' | 'Medio' | 'Alto'; color: string; reason: string };
    const gap = timePct === null ? null : costPct - timePct;
    if (gap === null) {
      risk = {
        level: costPct > 100 ? 'Alto' : costPct > 85 ? 'Medio' : 'Bajo',
        color: costPct > 100 ? 'destructive' : costPct > 85 ? 'amber' : 'emerald',
        reason: 'Sin fechas completas: riesgo estimado solo por consumo presupuestario.',
      };
    } else if (gap > 15 || costPct > 100) {
      risk = { level: 'Alto', color: 'destructive', reason: `Gasto ${costPct.toFixed(0)}% vs avance de tiempo ${timePct.toFixed(0)}%.` };
    } else if (gap > 5) {
      risk = { level: 'Medio', color: 'amber', reason: `Gasto ${costPct.toFixed(0)}% ligeramente adelantado al tiempo ${timePct.toFixed(0)}%.` };
    } else {
      risk = { level: 'Bajo', color: 'emerald', reason: `Gasto ${costPct.toFixed(0)}% alineado al tiempo ${timePct.toFixed(0)}%.` };
    }

    // ---- EAC / Utilidad proyectada ----
    const montoBase = Number(project?.finalAmountHnl) || Number(project?.initialAmount) ||
      Number(project?.financial?.contractAmount) || 0;
    const montoFinal = montoBase > 0 ? montoBase + montoAmpliadoTotal : 0;
    const progress = timePct !== null && timePct > 0 ? timePct / 100 : (pTotal > 0 ? dTotal / pTotal : 0);
    const eac = progress > 0.02 ? dTotal / progress : pTotal;
    const utilidadPresupuestada = Number(presupuestado.utilidad) || 0;
    const utilidadProyectada = montoFinal > 0 ? montoFinal - eac : pTotal - eac;

    // ---- Bolsa de contingencia ----
    const contPres = (Number(presupuestado.imprevistos) || 0) + (Number(presupuestado.escalatoria) || 0);
    const contUsed = (dyn.imprevistos || 0) + (dyn.escalatoria || 0);
    const contPct = contPres > 0 ? (contUsed / contPres) * 100 : 0;

    // ---- Insights ----
    const insights: Insight[] = [];
    for (const r of ROWS) {
      if (r.key === 'utilidad') continue;
      const p = Number(presupuestado[r.key]) || 0;
      const d = dyn[r.key as string] || 0;
      if (p > 0 && d > p * 1.15) {
        insights.push({
          kind: 'alert',
          title: `${r.label} sobrepasó el presupuesto en ${(((d - p) / p) * 100).toFixed(0)}%`,
          detail: `Presupuestado L ${fmt(p)} vs ejecutado L ${fmt(d)} (exceso L ${fmt(d - p)}). Revise órdenes de compra y alcances antes de nuevos compromisos.`,
        });
      } else if (p === 0 && d > 0) {
        insights.push({
          kind: 'alert',
          title: `${r.label} tiene gasto sin presupuesto asignado`,
          detail: `Se han ejecutado L ${fmt(d)} sin partida presupuestada. Formalice la partida o reclasifique el egreso.`,
        });
      }
    }
    if (contPct > 70) {
      insights.push({
        kind: 'alert',
        title: `Bolsa de imprevistos/escalatorias consumida al ${contPct.toFixed(0)}%`,
        detail: 'Congele aprobaciones discrecionales y documente cambios de alcance para negociar una adenda.',
      });
    }
    if (gap !== null && gap > 15) {
      insights.push({
        kind: 'alert',
        title: 'Ritmo de gasto adelantado al avance de obra',
        detail: `El consumo (${costPct.toFixed(0)}%) supera el tiempo transcurrido (${timePct!.toFixed(0)}%). Ajuste el plan de egresos mensual para evitar sobrecosto al cierre.`,
      });
    }

    // Sugerencias de reasignación
    const savings = ROWS
      .filter((r) => r.key !== 'utilidad')
      .map((r) => ({ r, slack: (Number(presupuestado[r.key]) || 0) - (dyn[r.key as string] || 0) }))
      .filter((x) => x.slack > 0)
      .sort((a, b) => b.slack - a.slack);
    const overruns = ROWS
      .filter((r) => r.key !== 'utilidad')
      .map((r) => ({ r, over: (dyn[r.key as string] || 0) - (Number(presupuestado[r.key]) || 0) }))
      .filter((x) => x.over > 0)
      .sort((a, b) => b.over - a.over);

    for (const o of overruns.slice(0, 3)) {
      const donor = savings.find((s) => s.slack >= o.over) || savings[0];
      if (donor) {
        insights.push({
          kind: 'tip',
          title: `Reasignar hasta L ${fmt(Math.min(donor.slack, o.over))} de "${donor.r.label}" hacia "${o.r.label}"`,
          detail: `"${donor.r.label}" mantiene holgura de L ${fmt(donor.slack)}; cubrir el sobrecosto de "${o.r.label}" (L ${fmt(o.over)}) desde ahí protege la utilidad final.`,
        });
      }
    }
    if (utilidadPresupuestada > 0 && utilidadProyectada < utilidadPresupuestada * 0.8) {
      insights.push({
        kind: 'tip',
        title: 'Utilidad proyectada por debajo de la meta',
        detail: `Meta L ${fmt(utilidadPresupuestada)} vs proyección L ${fmt(utilidadProyectada)}. Priorice renegociar precios con los subcontratistas de mayor concentración de pagos.`,
      });
    }
    if (subData.length > 0) {
      const top = subData[0];
      const share = dTotal > 0 ? (top.value / dTotal) * 100 : 0;
      if (share > 40) {
        insights.push({
          kind: 'tip',
          title: `Concentración alta en "${top.name}" (${share.toFixed(0)}% del gasto)`,
          detail: 'Dependencia elevada de un solo proveedor: evalúe una segunda fuente para reducir riesgo de plazo y precio.',
        });
      }
    }
    if (insights.length === 0) {
      insights.push({
        kind: 'ok',
        title: 'Sin desviaciones relevantes detectadas',
        detail: 'Todas las partidas se mantienen dentro del margen del 15% y la contingencia está bajo control.',
      });
    }

    // ---- Métricas de ingresos / cobranza ----
    const ests = estimaciones || [];
    const totalNeto = ests.reduce((s, e) => s + (Number(e.montoNeto) || 0), 0);
    const netoPagado = ests.filter((e) => e.pagado).reduce((s, e) => s + (Number(e.montoNeto) || 0), 0);
    const netoPendiente = ests.filter((e) => !e.pagado).reduce((s, e) => s + (Number(e.montoNeto) || 0), 0);
    const margenActual = totalBruto > 0 ? (utilidadDinamica / totalBruto) * 100 : 0;
    const margenPresupuestado = pTotal > 0 ? ((Number(presupuestado.utilidad) || 0) / pTotal) * 100 : 0;
    const anticipoMonto = Number(project?.anticipo?.monto) || 0;
    const anticipoRetenido = ests.reduce((s, e) => s + (Number(e.deduccionAnticipo) || 0), 0);
    const anticipoPct = anticipoMonto > 0 ? (anticipoRetenido / anticipoMonto) * 100 : 0;

    const cobranzaData = [
      { name: 'Pagadas', Monto: netoPagado },
      { name: 'No Pagadas', Monto: netoPendiente },
    ];
    const costoIngresoData = COST_KEYS.map((k) => {
      const row = ROWS.find((r) => r.key === k);
      return {
        name: row?.short || k,
        'Costo dinámico': dyn[k] || 0,
        'Total Bruto Facturado': totalBruto,
      };
    });

    return {
      dyn, pTotal, dTotal, chartData, pieData, burnData, subData,
      timePct, costPct, risk, eac, utilidadProyectada, utilidadPresupuestada,
      contPres, contUsed, contPct, insights, montoFinal, materiales, planilla,
      totalBruto, netoPagado, netoPendiente, totalNeto, margenActual, margenPresupuestado,
      anticipoMonto, anticipoRetenido, anticipoPct, cobranzaData, costoIngresoData,
      pSubTotal: COST_KEYS.reduce((s, k) => s + (Number((presupuestado as any)[k]) || 0), 0),
      dSubTotal: COST_KEYS.reduce((s, k) => s + (dyn[k] || 0), 0),
      utilidadDinamica,
    };

  }, [presupuestado, montoAmpliadoTotal, gastos, subcontratos, estimaciones, project]);


  if (loading) {
    return (
      <div className="min-h-screen serpic-gradient flex items-center justify-center p-4">
        <p className="text-muted-foreground">Cargando panel BI...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen serpic-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Proyecto no encontrado</h1>
          <Button onClick={() => navigate('/')}>Volver al Dashboard</Button>
        </div>
      </div>
    );
  }

  const { pTotal, dTotal, dyn, risk } = bi;
  const diff = pTotal - dTotal;
  const overBudget = diff < 0;
  const riskClasses =
    risk.color === 'destructive'
      ? 'bg-destructive/10 text-destructive border-destructive/30'
      : risk.color === 'amber'
        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
  const dotClass =
    risk.color === 'destructive' ? 'bg-destructive' : risk.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="min-h-screen serpic-gradient">
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <img src="/lovable-uploads/logo-transparent.png" alt="SERPIC" className="h-8 sm:h-10 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold">Resumen BI</h1>
              <p className="text-xs text-muted-foreground">{project?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
            </Button>
            <HeaderActions />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-card rounded-lg border border-border p-4">
          <h2 className="text-xl font-bold">{project?.name}</h2>
          <p className="text-sm text-muted-foreground">Cliente: {project?.client}</p>
          {project?.workType && <p className="text-sm text-muted-foreground">Tipo: {project.workType}</p>}
        </div>

        {/* Health KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={cn("border", riskClasses)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Nivel de Riesgo del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={cn("h-4 w-4 rounded-full", dotClass)} />
                <p className="text-2xl font-bold">{risk.level}</p>
              </div>
              <p className="text-xs opacity-90">{risk.reason}</p>
              <div className="text-xs opacity-90">
                Gasto: {bi.costPct.toFixed(1)}% · Tiempo: {bi.timePct === null ? 'n/d' : `${bi.timePct.toFixed(1)}%`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" /> Costo de Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className={cn("text-2xl font-bold", bi.dSubTotal > bi.pSubTotal && "text-destructive")}>
                L {fmt(bi.dSubTotal)}
              </p>
              <p className="text-xs text-muted-foreground">
                Meta / límite presupuestado: L {fmt(bi.pSubTotal)}
              </p>
              <p className="text-xs text-muted-foreground">
                Consumo: {bi.pSubTotal > 0 ? ((bi.dSubTotal / bi.pSubTotal) * 100).toFixed(1) : '0.0'}% del sub-total presupuestado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" /> Utilidad Dinámica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className={cn("text-2xl font-bold", bi.utilidadDinamica < 0 && "text-destructive")}>
                L {fmt(bi.utilidadDinamica)}
              </p>
              <p className="text-xs text-muted-foreground">
                Margen actual: {bi.margenActual.toFixed(1)}% del total bruto facturado
              </p>
              <p className="text-xs text-muted-foreground">
                Meta de utilidad presupuestada: L {fmt(bi.utilidadPresupuestada)}
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Financial KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Monto Presupuestado Total
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">L {fmt(pTotal)}</p></CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Monto Ejecutado (Dinámico)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold">L {fmt(dTotal)}</p>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full", overBudget ? "bg-destructive" : "bg-primary")}
                  style={{ width: `${Math.min(bi.costPct, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{bi.costPct.toFixed(1)}% de ejecución</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Scale className="h-4 w-4" /> Diferencia / Saldo Restante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className={cn("text-2xl font-bold", overBudget && "text-destructive")}>L {fmt(diff)}</p>
              <Badge variant={overBudget ? "destructive" : "secondary"}>
                {overBudget ? 'Sobrecosto' : 'Dentro de presupuesto'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Estimaciones / Ingresos KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Anticipo Pagado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-2xl font-bold whitespace-nowrap">L {fmt(bi.anticipoMonto)}</p>
              <p className="text-xs text-muted-foreground">Liquidado según pestaña Anticipos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" /> Estimaciones Neto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-2xl font-bold whitespace-nowrap">L {fmt(bi.totalNeto)}</p>
              <p className="text-xs text-muted-foreground">Suma de Monto Neto de todas las estimaciones</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Estimaciones Pagadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-2xl font-bold whitespace-nowrap">L {fmt(bi.netoPagado)}</p>
              <p className="text-xs text-muted-foreground">Estimaciones con estatus Pagada</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Estimaciones Pendiente Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-2xl font-bold whitespace-nowrap">L {fmt(bi.netoPendiente)}</p>
              <p className="text-xs text-muted-foreground">Estimaciones Neto - Estimaciones Pagadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribución de gastos ejecutados por rubro</CardTitle>
            </CardHeader>
            <CardContent className="h-[340px]">
              {bi.pieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Sin gastos ejecutados registrados.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bi.pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                      label={(e: any) => `${((e.value / dTotal) * 100).toFixed(0)}%`}
                    >
                      {bi.pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `L ${fmt(Number(v))}`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Concentración de pagos por subcontratista</CardTitle>
            </CardHeader>
            <CardContent className="h-[340px]">
              {bi.subData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Sin pagos registrados a subcontratistas.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bi.subData} layout="vertical" margin={{ top: 8, right: 40, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={fmtShort} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number, _n: string, props: any) => {
                      const pct = props?.payload?.porcentaje ?? 0;
                      return `L ${fmt(Number(v))} (${pct.toFixed(1)}%)`;
                    }} />
                    <Bar dataKey="value" name="Pagado" radius={[0, 4, 4, 0]}>
                      <LabelList dataKey="porcentaje" position="right" formatter={(val: number) => `${val.toFixed(1)}%`} />
                      {bi.subData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Presupuestado vs. Dinámico por rubro</CardTitle>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bi.chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtShort} />
                  <Tooltip formatter={(v: number) => `L ${fmt(Number(v))}`} />
                  <Legend />
                  <Bar dataKey="Presupuestado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Dinámico" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendencia de gastos mensuales (Burn Rate)</CardTitle>
            </CardHeader>
            <CardContent className="h-[340px]">
              {bi.burnData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Sin gastos registrados para calcular tendencia.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bi.burnData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtShort} />
                    <Tooltip formatter={(v: number) => `L ${fmt(Number(v))}`} />
                    <Legend />
                    <Line type="monotone" dataKey="Mensual" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Acumulado" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actionable insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4" /> Alertas y recomendaciones inteligentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bi.insights.map((ins, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3 rounded-lg border p-3",
                  ins.kind === 'alert' && "border-destructive/30 bg-destructive/5",
                  ins.kind === 'tip' && "border-amber-500/30 bg-amber-500/5",
                  ins.kind === 'ok' && "border-emerald-500/30 bg-emerald-500/5",
                )}
              >
                {ins.kind === 'alert' ? (
                  <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                ) : ins.kind === 'tip' ? (
                  <Lightbulb className="h-5 w-5 shrink-0 text-amber-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                )}
                <div>
                  <p className="text-sm font-semibold">{ins.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ins.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* KPIs de ingresos y cobranza */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Percent className="h-4 w-4" /> Margen de Utilidad Actual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className={cn(
                "text-2xl font-bold",
                bi.margenActual < 0 ? "text-destructive"
                  : bi.margenActual < bi.margenPresupuestado ? "text-amber-600" : "text-emerald-600",
              )}>
                {bi.margenActual.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                Meta presupuestada: {bi.margenPresupuestado.toFixed(1)}% · Utilidad dinámica L {fmt(bi.dyn.utilidad)}
              </p>
              {bi.margenActual < bi.margenPresupuestado && (
                <Badge variant={bi.margenActual < 0 ? "destructive" : "secondary"}>
                  {bi.margenActual < 0 ? 'Pérdida' : 'Por debajo de la meta'}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Cuentas por Cobrar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold whitespace-nowrap">L {fmt(bi.netoPendiente)}</p>
              <p className="text-xs text-muted-foreground">
                Estimaciones no pagadas · Cobrado L {fmt(bi.netoPagado)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Recuperación de Anticipo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold">{bi.anticipoPct.toFixed(1)}%</p>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(Math.max(bi.anticipoPct, 0), 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                Retenido L {fmt(bi.anticipoRetenido)} de L {fmt(bi.anticipoMonto)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de análisis financiero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado de Cobranza de Estimaciones</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bi.cobranzaData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtShort} />
                  <Tooltip formatter={(v: number) => `L ${fmt(Number(v))}`} />
                  <Bar dataKey="Monto" radius={[4, 4, 0, 0]}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Costos Dinámicos vs. Ingresos Facturados</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bi.costoIngresoData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtShort} />
                  <Tooltip formatter={(v: number) => `L ${fmt(Number(v))}`} />
                  <Legend />
                  <Bar dataKey="Costo dinámico" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Total Bruto Facturado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de apoyo */}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Costo Diferencial (resumen)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 pb-2 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
              <span className="text-left">Concepto</span>
              <span className="text-right">Presupuestado</span>
              <span className="text-right">Dinámico</span>
              <span className="text-right">Diferencia</span>
            </div>
            {ROWS.map((r) => {
              const p = Number(presupuestado[r.key]) || 0;
              const d = dyn[r.key as string] || 0;
              const df = p - d;
              return (
                <div key={r.key} className="grid grid-cols-4 gap-2 py-2 border-b border-border/50 text-sm">
                  <span className="font-medium text-left">{r.label}</span>
                  <span className="text-right">L {fmt(p)}</span>
                  <span className={cn("text-right", d < 0 && "text-destructive")}>L {fmt(d)}</span>
                  <span className={cn("text-right font-semibold", df < 0 && "text-destructive")}>L {fmt(df)}</span>
                </div>
              );
            })}
            <div className="grid grid-cols-4 gap-2 py-2 text-sm font-bold">
              <span className="text-left">Total</span>
              <span className="text-right">L {fmt(pTotal)}</span>
              <span className="text-right">L {fmt(dTotal)}</span>
              <span className={cn("text-right", diff < 0 && "text-destructive")}>L {fmt(diff)}</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProjectSummary;
