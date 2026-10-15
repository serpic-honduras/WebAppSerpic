import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Database, ShieldCheck, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import UsersManager from "@/components/settings/UsersManager";
import DatabaseManager from "@/components/settings/DatabaseManager";
import RolesManager from "@/components/settings/RolesManager";
import AlertsManager from "@/components/settings/AlertsManager";
import HeaderActions from "@/components/HeaderActions";
import { cn } from "@/lib/utils";

const Settings = () => {
  const { isAdmin, loading } = useSecureAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<"users" | "database" | "roles" | "alerts">("users");

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/");
  }, [isAdmin, loading, navigate]);

  if (loading || !isAdmin) return null;

  const navItems = [
    { id: "users" as const, label: "Usuarios", icon: Users },
    { id: "database" as const, label: "Base de Datos", icon: Database },
    { id: "roles" as const, label: "Roles", icon: ShieldCheck },
    { id: "alerts" as const, label: "Alertas", icon: Bell },
  ];


  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <HeaderActions />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Configuraciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
              {/* Sidebar */}
              <nav className="space-y-1 md:border-r md:pr-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = section === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSection(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-left transition-colors",
                        active
                          ? "bg-muted text-primary border-l-2 border-primary"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" /> {item.label}
                    </button>
                  );
                })}
              </nav>

              {/* Content */}
              <div>
                {section === "users" && <UsersManager />}
                {section === "database" && <DatabaseManager />}
                {section === "roles" && <RolesManager />}
                {section === "alerts" && <AlertsManager />}

              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
