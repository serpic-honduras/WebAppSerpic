
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types/project";
import BondsSection from "@/components/project-card/BondsSection";

interface BondsCardProps {
  project: Project;
  exchangeRate: number;
}

const BondsCard = ({ project, exchangeRate }: BondsCardProps) => {
  return (
    <Card className="lg:col-span-1 border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="bg-muted border-b border-border">
        <CardTitle className="text-lg sm:text-xl text-foreground">Fianzas</CardTitle>
      </CardHeader>
      <CardContent className="bg-card">
        <BondsSection 
          bonds={project.bonds} 
          exchangeRate={exchangeRate}
          currency={project.currency}
          projectStartDate={project.startDate}
        />
      </CardContent>
    </Card>
  );
};

export default BondsCard;
