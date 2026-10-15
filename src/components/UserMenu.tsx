import { useState, useEffect } from "react";
import { LogOut, User as UserIcon, Settings, Palette, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";

const UserMenu = () => {
  const { user, isAdmin, signOut } = useSecureAuth();
  const { theme, setTheme, themes } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name?: string | null; avatar_url?: string | null }>({});

  const loadProfile = () => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => data && setProfile(data));
  };

  useEffect(() => {
    loadProfile();
    const handler = () => loadProfile();
    window.addEventListener("profile-updated", handler);
    return () => window.removeEventListener("profile-updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente" });
      navigate("/");
    } catch {
      toast({ title: "Error", description: "Error al cerrar sesión", variant: "destructive" });
    }
  };

  const initials = (profile.full_name || user?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 border-border">
          <Avatar className="h-7 w-7">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt="avatar" />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline max-w-[160px] truncate">
            {profile.full_name || user?.email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card">
        <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <UserIcon className="h-4 w-4 mr-2" /> Perfil
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="h-4 w-4 mr-2" /> Configuraciones
          </DropdownMenuItem>
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="h-4 w-4 mr-2" /> Tema de Color
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 bg-popover">
            {themes.map((t) => (
              <DropdownMenuItem key={t.id} onClick={() => setTheme(t.id)}>
                <span className="mr-2">{t.emoji}</span>
                <span
                  className="h-3 w-3 rounded-full mr-2 border"
                  style={{ backgroundColor: t.swatch }}
                />
                <span className="flex-1">{t.name}</span>
                {theme === t.id && <Check className="h-4 w-4 ml-2" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-primary">
          <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
