import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import UserMenu from "@/components/UserMenu";
import { useGarantiaAlerts } from "@/hooks/useGarantiaAlerts";

/** Global header actions: guarantee alerts bell + user profile menu. */
const HeaderActions = () => {
  const { alerts, count, thresholdDays } = useGarantiaAlerts();
  const navigate = useNavigate();

  const goToGarantia = (projectId: string) => {
    try {
      sessionStorage.setItem(`project-tab:${projectId}`, 'garantias');
    } catch {
      /* ignore storage failures */
    }
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative border-border" aria-label="Alertas de garantías">
            <Bell className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0 bg-popover">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Alertas de Garantías</p>
            <p className="text-xs text-muted-foreground">
              Vencimientos en {thresholdDays} días o menos
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                No hay garantías próximas a vencer.
              </p>
            ) : (
              alerts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => goToGarantia(a.projectId)}
                  className="w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted transition-colors"
                >
                  <p className="text-sm font-medium text-foreground truncate">{a.numero}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.projectName}</p>
                  <p className={`text-xs font-semibold mt-1 ${a.expired ? 'text-destructive' : 'text-foreground'}`}>
                    {a.expired
                      ? `Vencida hace ${Math.abs(a.daysLeft)} día(s)`
                      : a.daysLeft === 0
                        ? 'Vence hoy'
                        : `Vence en ${a.daysLeft} día(s)`}
                    {' · '}
                    {a.vencimiento}
                  </p>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      <UserMenu />
    </div>
  );
};

export default HeaderActions;
