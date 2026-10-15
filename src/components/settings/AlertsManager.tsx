import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAlertSettings } from "@/hooks/useAlertSettings";

const AlertsManager = () => {
  const { settings, saveSettings } = useAlertSettings();
  const { toast } = useToast();
  const [days, setDays] = useState(String(settings.garantiasDays));

  useEffect(() => {
    setDays(String(settings.garantiasDays));
  }, [settings.garantiasDays]);

  const handleSave = () => {
    const parsed = Number(days);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast({ title: "Valor inválido", description: "Ingresa un número de días válido.", variant: "destructive" });
      return;
    }
    saveSettings({ garantiasDays: Math.round(parsed) });
    toast({ title: "Alertas actualizadas", description: `Se avisará con ${Math.round(parsed)} días de anticipación.` });
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" /> Garantías
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-sm">
          <Label htmlFor="garantias-days">Días de anticipación para alerta de vencimiento</Label>
          <Input
            id="garantias-days"
            type="number"
            min={0}
            step={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Se alerta cuando (Fecha de vencimiento − Fecha actual) sea menor o igual a este número de días.
          </p>
        </div>
        <Button onClick={handleSave}>Guardar</Button>
      </CardContent>
    </Card>
  );
};

export default AlertsManager;
