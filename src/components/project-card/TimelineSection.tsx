
import { Calendar, Clock } from "lucide-react";

interface TimelineSectionProps {
  startDate: string;
  finishDate: string;
  estimatedCompletion: string;
}

const TimelineSection = ({ startDate, finishDate, estimatedCompletion }: TimelineSectionProps) => {
  const progressPercentage = () => {
    const start = new Date(startDate);
    const end = new Date(finishDate);
    const now = new Date();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / total) * 100);
  };

  const progress = progressPercentage();

  return (
    <div className="bg-muted p-4 rounded-lg">
      <div className="flex items-center space-x-2 text-base font-semibold mb-3">
        <Calendar className="h-5 w-5 text-primary" />
        <span>Cronograma del Proyecto</span>
      </div>
      
      <div className="space-y-3 text-sm">
        <div>
          <span className="font-medium">Fecha de Inicio:</span> {new Date(startDate).toLocaleDateString('es-ES')}
        </div>
        <div>
          <span className="font-medium">Fecha de Finalización:</span> {new Date(finishDate).toLocaleDateString('es-ES')}
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Finalización Estimada:</span> 
          <span>{new Date(estimatedCompletion).toLocaleDateString('es-ES')}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Progreso</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineSection;
