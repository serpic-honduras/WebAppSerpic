import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, MapPin, User, Mail, Phone, Calendar, Clock, FileText, Users } from "lucide-react";
import { Project } from "@/types/project";

interface BasicInformationCardProps {
  project: Project;
}

const BasicInformationCard = ({ project }: BasicInformationCardProps) => {
  const startDate = project.startOrderDate || project.startDate;
  const finishDate = (() => {
    if (project.startOrderDate && project.finalTermDays && project.finalTermDays > 0) {
      const d = new Date(project.startOrderDate);
      d.setDate(d.getDate() + Number(project.finalTermDays));
      return d.toISOString().slice(0, 10);
    }
    return project.finalReceptionDate || project.finishDate;
  })();

  const computeProgress = () => {
    if (!startDate || !finishDate) return 0;
    const start = new Date(startDate).getTime();
    const end = new Date(finishDate).getTime();
    const now = Date.now();
    if (end <= start) return 0;
    const elapsed = now - start;
    if (elapsed <= 0) return 0;
    return Math.round((elapsed / (end - start)) * 100);
  };

  const progress = computeProgress();
  const isOverdue = progress > 100;
  const barWidth = Math.min(progress, 100);
  const overflow = isOverdue ? Math.min(progress - 100, 100) : 0;

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("es-ES") : "—";

  const fmtHnl = (v?: number) =>
    v != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) : "—";
  const fmtUsd = (v?: number) =>
    v != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v) : "—";

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between gap-3 text-sm py-1.5 border-b border-border last:border-0">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="text-foreground text-right">{value || "—"}</span>
    </div>
  );

  return (
    <Card className="lg:col-span-1 border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="bg-muted border-b border-border">
        <CardTitle className="text-lg sm:text-xl text-foreground flex items-center space-x-2">
          <Building className="h-5 w-5 text-primary" />
          <span>Información Básica</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 bg-card pt-4">
        {/* Generales */}
        <div>
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Building className="h-4 w-4" /> Generales
          </h4>
          <Row label="Nombre del Proyecto" value={project.name} />
          <Row label="Número de Contrato" value={project.contractNumber} />
          <Row label="Ubicación" value={project.location} />
          <Row label="Consorcio" value={project.consortium} />
          <Row label="Residente" value={project.residentName} />
          <Row label="Tipo de Obra" value={project.workType || project.projectType} />
          <Row label="Monto Inicial" value={project.initialAmount != null ? fmtHnl(project.initialAmount) : undefined} />
          <Row label="Plazo Inicial (días)" value={project.initialTermDays} />
          <Row label="Fecha Orden de Inicio" value={formatDate(project.startOrderDate)} />
        </div>

        {/* Cliente */}
        <div>
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" /> Información del Cliente
          </h4>
          <Row label="Ente Contratante" value={project.client} />
          <Row label="Teléfono" value={project.clientContact?.phone} />
          <Row label="Contacto" value={project.clientContact?.name} />
          <Row label="Correo" value={project.clientContact?.email} />
        </div>

        {/* Cierre */}
        <div>
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Cierre
          </h4>
          <Row label="M² de Construcción" value={project.constructionM2} />
          {project.activitiesDescription && (
            <div className="py-2 text-sm">
              <div className="font-medium text-muted-foreground mb-1">Descripción de Actividades</div>
              <p className="text-foreground whitespace-pre-wrap">{project.activitiesDescription}</p>
            </div>
          )}
          <Row label="Fecha Recepción Final" value={formatDate(project.finalReceptionDate)} />
          <Row label="Plazo Final (días)" value={project.finalTermDays} />
          <Row label="Duración Final (meses)" value={project.finalDurationMonths} />
          <Row label="Año de Ejecución" value={project.executionYear} />
          <Row label="Monto Final L" value={project.finalAmountHnl != null ? fmtHnl(project.finalAmountHnl) : undefined} />
          <Row label="Tasa de Cambio" value={project.projectExchangeRate} />
          <Row label="Monto Final $" value={project.finalAmountUsd != null ? fmtUsd(project.finalAmountUsd) : undefined} />
        </div>

        {/* Duración / progreso de tiempo */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center space-x-2 text-base font-semibold mb-3">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Línea de Tiempo</span>
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Inicio:</span> {formatDate(startDate)}</div>
            <div><span className="font-medium">Recepción Final:</span> {formatDate(finishDate)}</div>

            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Tiempo transcurrido</span>
                <span className={isOverdue ? "text-red-600 font-semibold" : ""}>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden flex">
                <div
                  className={`${isOverdue ? "bg-red-500" : "bg-blue-600"} h-3 transition-all duration-300`}
                  style={{ width: `${barWidth}%` }}
                />
                {isOverdue && (
                  <div
                    className="bg-red-700 h-3 transition-all duration-300"
                    style={{ width: `${overflow}%` }}
                  />
                )}
              </div>
              {isOverdue && (
                <p className="text-xs text-red-600 mt-1">
                  El proyecto ha excedido el tiempo contractual en {progress - 100}%.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicInformationCard;
