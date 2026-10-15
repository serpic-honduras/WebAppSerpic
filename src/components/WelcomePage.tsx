
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Calendar, DollarSign, ArrowRight, CheckCircle } from "lucide-react";

interface WelcomePageProps {
  onGetStarted: () => void;
}

const WelcomePage = ({
  onGetStarted
}: WelcomePageProps) => {
  const features = [{
    icon: Building2,
    title: "Gestión de Proyectos",
    description: "Seguimiento integral de proyectos con gestión detallada de información"
  }, {
    icon: Users,
    title: "Coordinación de Equipos",
    description: "Gestiona efectivamente los gestores de proyectos y relaciones con clientes"
  }, {
    icon: Calendar,
    title: "Seguimiento de Cronogramas",
    description: "Monitorea el progreso de proyectos con fechas de inicio, plazos y estimaciones de finalización"
  }, {
    icon: DollarSign,
    title: "Resumen Financiero",
    description: "Rastrea montos de contratos, gastos, fianzas e información de seguros"
  }];

  const benefits = ["Gestión centralizada de información de proyectos", "Seguimiento de estado de proyectos en tiempo real", "Supervisión financiera integral", "Documentación profesional de proyectos", "Comunicación fácil con clientes y equipos", "Almacenamiento seguro de datos con Supabase"];

  return (
    <div className="min-h-screen bg-serpic-gradient">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center">
            <img 
              src="/lovable-uploads/logo-transparent.png" 
              alt="SERPIC Constructora Logo" 
              className="h-16 w-auto" 
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Bienvenido a SERPIC
            <span className="block text-primary">Sistema de Gestión de Proyectos</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Plataforma integral de gestión. Rastrea el progreso, gestiona las finanzas y coordina equipos, todo en un solo lugar.
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={onGetStarted} 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all"
            >
              Comenzar
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-background/90 mb-4">Plataforma para uso exclusivo de Colaboradores de SERPIC</p>
            <p className="text-sm text-background/70">© 2025 SERPIC S. de R.l. de C.V. Todos los derechos reservados. | CICH 054-12-N-CT</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
