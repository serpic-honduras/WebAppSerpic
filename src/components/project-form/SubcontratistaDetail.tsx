import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Subcontrato, Gasto, SubcategoriaCostoDirecto, TipoGasto } from "@/types/project";
import { cn } from "@/lib/utils";

interface Props {
  subcontratista: Subcontrato | null;
  gastos: Gasto[];
  onClose: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SUBCATEGORIAS: SubcategoriaCostoDirecto[] = ['Abono a contrato', 'Materiales', 'Planilla', 'Anticipos'];

const OTRAS_CATEGORIAS: TipoGasto[] = [
  'Costo Indirecto de Obra',
  'Fianzas',
  'Seguros',
  'Administración',
  'Escalatorias',
  'Imprevistos',
  'Financieros',
];

const SubcontratistaDetail: React.FC<Props> = ({ subcontratista, gastos, onClose }) => {
  if (!subcontratista) return null;

  const ownGastos = gastos.filter((g) => g.subcontratistaId === subcontratista.id);

  const directo: Record<string, number> = {
    'Abono a contrato': 0,
    'Materiales': 0,
    'Planilla': 0,
    'Anticipos': 0,
    'Sin subcategoría': 0,
  };
  const otras: Record<string, number> = Object.fromEntries(OTRAS_CATEGORIAS.map((c) => [c, 0]));

  for (const g of ownGastos) {
    const monto = Number(g.montoPagado) || 0;
    if (g.tipoGasto === 'Costo Directo') {
      const key = g.subcategoriaCostoDirecto || 'Sin subcategoría';
      directo[key] = (directo[key] || 0) + monto;
    } else if (g.tipoGasto) {
      otras[g.tipoGasto] = (otras[g.tipoGasto] || 0) + monto;
    }
  }

  const directoKeys = [...SUBCATEGORIAS.map(String), ...Object.keys(directo).filter((k) => !SUBCATEGORIAS.includes(k as SubcategoriaCostoDirecto) && directo[k] !== 0)];
  const otrasKeys = [...OTRAS_CATEGORIAS.map(String), ...Object.keys(otras).filter((k) => !OTRAS_CATEGORIAS.includes(k as TipoGasto) && otras[k] !== 0)];

  const totalDirecto = directoKeys.reduce((s, k) => s + (directo[k] || 0), 0);
  const totalOtras = otrasKeys.reduce((s, k) => s + (otras[k] || 0), 0);
  const totalPagado = totalDirecto + totalOtras;
  const adeudado = (Number(subcontratista.monto) || 0) - totalPagado;

  return (
    <Dialog open={!!subcontratista} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{subcontratista.nombre}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-left">
          <div>
            <p className="text-sm text-muted-foreground">Descripción</p>
            <p className="text-sm">{subcontratista.descripcion || '—'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-md border border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">Monto de Subcontrato</p>
              <p className="font-semibold">L {fmt(Number(subcontratista.monto) || 0)}</p>
            </div>
            <div className="p-3 rounded-md border border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">Total pagado (todas las categorías)</p>
              <p className="font-semibold">L {fmt(totalPagado)}</p>
            </div>
          </div>

          <div>
            <p className="font-medium mb-2">Desglose de Pagos por Categoría</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 px-2 font-medium">Categoría / Subcategoría</th>
                  <th className="py-2 px-2 font-medium text-right">Monto Pagado (L)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-muted/40">
                  <td className="py-2 px-2 font-medium" colSpan={2}>Costo Directo</td>
                </tr>
                {directoKeys.map((cat) => (
                  <tr key={cat} className="border-b border-border/50">
                    <td className="py-2 px-2 pl-6">{cat}</td>
                    <td className="py-2 px-2 text-right">L {fmt(directo[cat] || 0)}</td>
                  </tr>
                ))}
                <tr className="border-b border-border font-medium">
                  <td className="py-2 px-2 pl-6">Subtotal Costo Directo</td>
                  <td className="py-2 px-2 text-right">L {fmt(totalDirecto)}</td>
                </tr>

                <tr className="bg-muted/40">
                  <td className="py-2 px-2 font-medium" colSpan={2}>Costos Indirectos y Otros</td>
                </tr>
                {otrasKeys.map((cat) => (
                  <tr key={cat} className="border-b border-border/50">
                    <td className="py-2 px-2 pl-6">{cat}</td>
                    <td className="py-2 px-2 text-right">L {fmt(otras[cat] || 0)}</td>
                  </tr>
                ))}
                <tr className="border-b border-border font-medium">
                  <td className="py-2 px-2 pl-6">Subtotal Indirectos y Otros</td>
                  <td className="py-2 px-2 text-right">L {fmt(totalOtras)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="py-2 px-2">Total de todas las categorías</td>
                  <td className="py-2 px-2 text-right">L {fmt(totalPagado)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-between items-center p-3 rounded-md border border-border bg-muted">
            <span className="font-medium">Monto Adeudado:</span>
            <span className={cn("font-bold text-lg", adeudado < 0 ? "text-destructive" : "text-foreground")}>
              L {fmt(adeudado)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubcontratistaDetail;
