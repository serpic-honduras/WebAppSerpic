
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Project } from "@/types/project";
import FinancialSection from "@/components/project-card/FinancialSection";

interface FinancialCardProps {
  project: Project;
}

const FinancialCard = ({ project }: FinancialCardProps) => {
  return (
    <Card className="lg:col-span-2 xl:col-span-1 border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="bg-muted border-b border-border">
        <CardTitle className="text-lg sm:text-xl text-foreground flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <span>Información Financiera</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-card">
        <FinancialSection 
          financial={project.financial} 
          currency={project.currency}
          notes={project.notes}
        />
      </CardContent>
    </Card>
  );
};

export default FinancialCard;
