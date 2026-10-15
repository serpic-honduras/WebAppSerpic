
import { Project } from "@/types/project";
import BasicInformationCard from "./cards/BasicInformationCard";
import FinancialCard from "./cards/FinancialCard";
import AddendumsChangeOrdersCard from "./cards/AddendumsChangeOrdersCard";
import BondsCard from "./cards/BondsCard";
import InsuranceCard from "./cards/InsuranceCard";
import PhotosCard from "./cards/PhotosCard";
import ExchangeRateCard from "./cards/ExchangeRateCard";

interface ProjectViewCardsProps {
  project: Project;
  exchangeRate: number;
}

const ProjectViewCards = ({ project, exchangeRate }: ProjectViewCardsProps) => {
  return (
    <>
      <BasicInformationCard project={project} />
      <FinancialCard project={project} />
      <AddendumsChangeOrdersCard project={project} />
      <BondsCard project={project} exchangeRate={exchangeRate} />
      <InsuranceCard project={project} exchangeRate={exchangeRate} />
      <PhotosCard project={project} />
      <ExchangeRateCard project={project} exchangeRate={exchangeRate} />
    </>
  );
};

export default ProjectViewCards;
