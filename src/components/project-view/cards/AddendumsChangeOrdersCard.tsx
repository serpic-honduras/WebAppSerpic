
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { Project } from "@/types/project";
import { formatCurrency } from "@/utils/currencyUtils";

interface AddendumsChangeOrdersCardProps {
  project: Project;
}

const AddendumsChangeOrdersCard = ({ project }: AddendumsChangeOrdersCardProps) => {
  // Only render if data exists
  if (!project.addendums?.length && !project.changeOrders?.length) {
    return null;
  }

  return (
    <Card className="lg:col-span-2 xl:col-span-3 border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="bg-muted border-b border-border">
        <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl text-foreground">
          <FileText className="h-5 w-5 text-primary" />
          <span>Adendas y Órdenes de Cambio</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-card">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {project.addendums?.length > 0 && (
            <div>
              <h3 className="font-medium text-foreground mb-3">Adendas al Contrato</h3>
              <div className="space-y-3">
                {project.addendums.map((addendum) => (
                  <div key={addendum.id} className="border border-border rounded-lg p-3 bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{addendum.title}</span>
                      <Badge variant="outline" className="border-border text-muted-foreground">{addendum.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{addendum.description}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fecha: {new Date(addendum.date).toLocaleDateString('es-ES')}</span>
                      {addendum.amount !== undefined && addendum.amount !== null && <span className="text-muted-foreground">Monto: {formatCurrency(addendum.amount, project.currency)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {project.changeOrders?.length > 0 && (
            <div>
              <h3 className="font-medium text-foreground mb-3">Órdenes de Cambio</h3>
              <div className="space-y-3">
                {project.changeOrders.map((changeOrder) => (
                  <div key={changeOrder.id} className="border border-border rounded-lg p-3 bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{changeOrder.title}</span>
                      <Badge variant="outline" className="border-border text-muted-foreground">{changeOrder.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{changeOrder.description}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fecha: {new Date(changeOrder.date).toLocaleDateString('es-ES')}</span>
                      <span className="text-muted-foreground">Monto: {formatCurrency(changeOrder.amount, project.currency)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AddendumsChangeOrdersCard;
