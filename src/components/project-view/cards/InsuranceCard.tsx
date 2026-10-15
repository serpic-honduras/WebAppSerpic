
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types/project";
import InsuranceSection from "@/components/project-card/InsuranceSection";

interface InsuranceCardProps {
  project: Project;
  exchangeRate: number;
}

const InsuranceCard = ({ project, exchangeRate }: InsuranceCardProps) => {
  return (
    <Card className="lg:col-span-1 border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="bg-muted border-b border-border">
        <CardTitle className="text-lg sm:text-xl text-foreground">Seguros</CardTitle>
      </CardHeader>
      <CardContent className="bg-card">
        <InsuranceSection 
          insurance={project.insurance} 
          exchangeRate={exchangeRate}
          currency={project.currency}
          projectStartDate={project.startDate}
        />
      </CardContent>
    </Card>
  );
};

export default InsuranceCard;
