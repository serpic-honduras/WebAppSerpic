
import { DollarSign, FileText, Calculator } from "lucide-react";
import { Financial } from "@/types/project";
import { formatCurrency } from "@/utils/currencyUtils";

interface FinancialSectionProps {
  financial: Financial;
  currency: 'USD' | 'HNL' | 'EUR';
  notes?: string;
}

const FinancialSection = ({ financial, currency, notes }: FinancialSectionProps) => {
  // Calculate total monthly expenses from breakdown
  const totalMonthlyExpenses = financial.monthlyExpenseBreakdown?.reduce(
    (sum, expense) => sum + expense.amount, 0
  ) || financial.monthlyExpenses || 0;

  // Calculate remaining amount
  const remainingAmount = financial.contractAmount - totalMonthlyExpenses;

  // Calculate total from costo directo proyecto if available
  const costoDirectoTotal = financial.costoDirectoProyecto ? 
    financial.costoDirectoProyecto.costoDirecto +
    financial.costoDirectoProyecto.indirectosDeObra +
    (financial.costoDirectoProyecto.fianzas ?? 0) +
    (financial.costoDirectoProyecto.seguros ?? 0) +
    financial.costoDirectoProyecto.administracion +
    financial.costoDirectoProyecto.escalatoria +
    financial.costoDirectoProyecto.imprevistos +
    financial.costoDirectoProyecto.financieros +
    financial.costoDirectoProyecto.utilidad : 0;

  const isBalanced = financial.costoDirectoProyecto ? 
    Math.abs(costoDirectoTotal - financial.contractAmount) < 0.01 : true;

  return (
    <div className="bg-muted p-4 rounded-lg border border-border">
      <div className="flex items-center space-x-2 text-base font-semibold mb-3">
        <DollarSign className="h-5 w-5 text-primary" />
        <span className="text-foreground">Información Financiera</span>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <div className="font-medium text-sm mb-1 text-muted-foreground">Monto del Contrato</div>
          <div className="text-lg font-bold text-primary">
            {formatCurrency(financial.contractAmount, currency)}
          </div>
        </div>
        
        <div>
          <div className="font-medium text-sm mb-1 text-muted-foreground">Gastos Mensuales Totales</div>
          <div className="text-lg font-semibold text-foreground">
            {formatCurrency(totalMonthlyExpenses, currency)}
          </div>
          {financial.monthlyExpenseBreakdown && financial.monthlyExpenseBreakdown.length > 0 && (
            <div className="text-xs text-primary mt-1">
              Desglose de {financial.monthlyExpenseBreakdown.length} meses registrados
            </div>
          )}
        </div>

        <div>
          <div className="font-medium text-sm mb-1 text-muted-foreground">Monto Restante para Completar</div>
          <div className={`text-lg font-bold ${remainingAmount >= 0 ? 'text-primary' : 'text-red-600'}`}>
            {formatCurrency(remainingAmount, currency)}
          </div>
          {remainingAmount < 0 && (
            <div className="text-xs text-red-600 mt-1">
              ⚠️ Gastos exceden el monto del contrato
            </div>
          )}
        </div>

        {/* Costo Directo Proyecto Section */}
        {financial.costoDirectoProyecto && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center space-x-2 text-sm font-medium mb-2">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="text-foreground">Costo Directo Proyecto</span>
            </div>
            <div className="bg-card p-3 rounded border border-border">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Costo Directo:</span>
                  <span className="font-medium">{formatCurrency(financial.costoDirectoProyecto.costoDirecto, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Indirectos de Obra:</span>
                  <span className="font-medium">{formatCurrency(financial.costoDirectoProyecto.indirectosDeObra, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fianzas:</span>
                  <span className="font-medium">{formatCurrency(financial.costoDirectoProyecto.fianzas ?? 0, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seguros:</span>
                  <span className="font-medium">{formatCurrency(financial.costoDirectoProyecto.seguros ?? 0, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Administración:</span>
                  <span className="font-medium">{formatCurrency(financial.costoDirectoProyecto.administracion, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Escalatoria:</span>
                  <span className="font-medium">{formatCurrency(financial.costoDirectoProyecto.escalatoria, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Imprevistos:</span>
                  <span className="font-medium">{formatCurrency(financial.costoDirectoProyecto.imprevistos, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Financieros:</span>
                  <span className="font-medium">{formatCurrency(financial.costoDirectoProyecto.financieros, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Utilidad:</span>
                  <span className="font-medium">{formatCurrency(financial.costoDirectoProyecto.utilidad, currency)}</span>
                </div>
              </div>
              <div className="border-t border-border mt-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Total:</span>
                  <span className={`font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(costoDirectoTotal, currency)}
                  </span>
                </div>
                {!isBalanced && (
                  <div className="text-xs text-red-600 mt-1">
                    ⚠️ Total no coincide con monto del contrato
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Project Notes */}
        {notes && notes.trim() && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center space-x-2 text-sm font-medium mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-foreground">Notas del Proyecto</span>
            </div>
            <div className="bg-card p-3 rounded border border-border">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialSection;
