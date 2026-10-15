
import { Shield, Calendar, Building } from "lucide-react";
import { Insurance } from "@/types/project";
import { formatCurrency, convertToLempiras, getEurToHnlRate } from "@/utils/currencyUtils";

interface InsuranceSectionProps {
  insurance: Insurance;
  exchangeRate: number;
  currency: 'USD' | 'HNL' | 'EUR';
  projectStartDate: string;
}

const InsuranceSection = ({ insurance, exchangeRate, currency, projectStartDate }: InsuranceSectionProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-HN');
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

  const generalLiabilityAmount = getAmountDisplay(insurance.generalLiability);
  const workersCompAmount = getAmountDisplay(insurance.workersComp);

  return (
    <div className="bg-orange-50 p-4 rounded-lg">
      <div className="flex items-center space-x-2 text-base font-semibold mb-4">
        <Shield className="h-5 w-5 text-orange-600" />
        <span>Seguros</span>
      </div>
      
      <div className="space-y-4">
        {/* General Liability Insurance */}
        <div className="bg-card p-3 rounded-lg border">
          <div className="font-medium mb-3 text-sm">Responsabilidad General</div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Monto</div>
              <div className="font-semibold">
                {generalLiabilityAmount.primary}
              </div>
              {generalLiabilityAmount.secondary && (
                <div className="text-xs text-muted-foreground">
                  {generalLiabilityAmount.secondary}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Vencimiento
              </div>
              <div className="text-sm">
                {formatDate(insurance.generalLiabilityDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center">
                <Building className="h-3 w-3 mr-1" />
                Aseguradora
              </div>
              <div className="text-sm break-words">
                {insurance.generalLiabilityCompany || 'No especificada'}
              </div>
            </div>
          </div>
        </div>

        {/* Workers Compensation Insurance */}
        <div className="bg-card p-3 rounded-lg border">
          <div className="font-medium mb-3 text-sm">Compensación Laboral</div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Monto</div>
              <div className="font-semibold">
                {workersCompAmount.primary}
              </div>
              {workersCompAmount.secondary && (
                <div className="text-xs text-muted-foreground">
                  {workersCompAmount.secondary}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Vencimiento
              </div>
              <div className="text-sm">
                {formatDate(insurance.workersCompDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center">
                <Building className="h-3 w-3 mr-1" />
                Aseguradora
              </div>
              <div className="text-sm break-words">
                {insurance.workersCompCompany || 'No especificada'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceSection;
