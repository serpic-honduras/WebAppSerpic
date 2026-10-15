
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Project } from "@/types/project";
import { formatNumber } from "@/utils/currencyUtils";

interface ExchangeRateCardProps {
  project: Project;
  exchangeRate: number;
}

const ExchangeRateCard = ({ project, exchangeRate }: ExchangeRateCardProps) => {
  // Only show if currency is not HNL
  if (project.currency === 'HNL') {
    return null;
  }

  return (
    <Card className="lg:col-span-2 xl:col-span-3 border-l-4 border-l-muted-foreground shadow-md">
      <CardContent className="pt-6 bg-card">
        <div className="text-sm text-muted-foreground p-3 bg-muted rounded flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          Tipo de cambio de referencia: L {formatNumber(exchangeRate)} / {project.currency}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExchangeRateCard;
