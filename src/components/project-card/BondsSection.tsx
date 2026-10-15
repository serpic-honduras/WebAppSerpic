
import { Shield, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Bonds } from "@/types/project";
import { formatCurrency, convertToLempiras, getEurToHnlRate } from "@/utils/currencyUtils";

interface BondsSectionProps {
  bonds: Bonds;
  exchangeRate: number;
  currency: 'USD' | 'HNL' | 'EUR';
  projectStartDate: string;
}

const BondsSection = ({ bonds, exchangeRate, currency, projectStartDate }: BondsSectionProps) => {
  // Check if performance bond is overdue
  const isPerformanceBondOverdue = () => {
    if (!bonds.performanceBondDate) return false;
    const bondDate = new Date(bonds.performanceBondDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bondDate < today;
  };

  // Check if advance payment bond is overdue
  const isAdvancePaymentBondOverdue = () => {
    if (!bonds.advancePaymentBondDate) return false;
    const bondDate = new Date(bonds.advancePaymentBondDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bondDate < today;
  };

  // Function to get converted amount and display both original and HNL
  const getAmountDisplay = (amount: number) => {
    if (currency === 'HNL') {
      return {
        primary: formatCurrency(amount, 'HNL'),
        secondary: null
      };
    } else if (currency === 'USD') {
      return {
        primary: formatCurrency(convertToLempiras(amount, exchangeRate), 'HNL'),
        secondary: formatCurrency(amount, 'USD')
      };
    } else { // EUR
      const eurToHnlRate = getEurToHnlRate(projectStartDate);
      return {
        primary: formatCurrency(convertToLempiras(amount, eurToHnlRate), 'HNL'),
        secondary: formatCurrency(amount, 'EUR')
      };
    }
  };

  const performanceBondOverdue = isPerformanceBondOverdue();
  const advancePaymentBondOverdue = isAdvancePaymentBondOverdue();

  const performanceBondAmount = getAmountDisplay(bonds.performanceBond);
  const advancePaymentBondAmount = getAmountDisplay(bonds.advancePaymentBond);

  return (
    <div className="bg-purple-50 p-4 rounded-lg">
      <div className="flex items-center space-x-2 text-base font-semibold mb-4">
        <Shield className="h-5 w-5 text-purple-600" />
        <span>Fianzas</span>
      </div>
      
      <div className="space-y-4">
        {/* Performance Bond */}
        <div className="bg-card p-3 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium text-sm">Fianza de Cumplimiento</div>
            {performanceBondOverdue && (
              <Badge className="bg-red-100 text-red-800 text-xs px-2 py-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Vencida
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-lg font-semibold">
                {performanceBondAmount.primary}
              </div>
              {performanceBondAmount.secondary && (
                <div className="text-sm text-muted-foreground">
                  {performanceBondAmount.secondary}
                </div>
              )}
            </div>
            {bonds.performanceBondNumber && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Número:</span> {bonds.performanceBondNumber}
              </div>
            )}
            {bonds.performanceBondIssuer && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Emisor:</span> {bonds.performanceBondIssuer}
              </div>
            )}
            {bonds.performanceBondDate && (
              <div className={`text-xs ${performanceBondOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                <span className="font-medium">Vencimiento:</span> {new Date(bonds.performanceBondDate).toLocaleDateString('es-ES')}
              </div>
            )}
          </div>
        </div>

        {/* Advance Payment Bond */}
        <div className="bg-card p-3 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium text-sm">Fianza de Anticipo</div>
            {advancePaymentBondOverdue && (
              <Badge className="bg-red-100 text-red-800 text-xs px-2 py-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Vencida
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-lg font-semibold">
                {advancePaymentBondAmount.primary}
              </div>
              {advancePaymentBondAmount.secondary && (
                <div className="text-sm text-muted-foreground">
                  {advancePaymentBondAmount.secondary}
                </div>
              )}
            </div>
            {bonds.advancePaymentBondNumber && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Número:</span> {bonds.advancePaymentBondNumber}
              </div>
            )}
            {bonds.advancePaymentBondIssuer && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Emisor:</span> {bonds.advancePaymentBondIssuer}
              </div>
            )}
            {bonds.advancePaymentBondDate && (
              <div className={`text-xs ${advancePaymentBondOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                <span className="font-medium">Vencimiento:</span> {new Date(bonds.advancePaymentBondDate).toLocaleDateString('es-ES')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BondsSection;
