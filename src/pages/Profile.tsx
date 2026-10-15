import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import HeaderActions from "@/components/HeaderActions";

const Profile = () => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? "");
          setAvatarUrl(data.avatar_url ?? null);
        }
      });
  }, [user]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl ?? null;
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      setAvatarUrl(url);
      toast({ title: "Foto actualizada" });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error: profileErr } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, full_name: fullName, email: email || user.email },
          { onConflict: "id" }
        )
        .select()
        .single();
      if (profileErr) throw profileErr;

      if (email && email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
      }
      if (password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setPassword("");
      }
      window.dispatchEvent(new Event("profile-updated"));
      toast({ title: "Perfil actualizado" });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const initials = (fullName || email || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <HeaderActions />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Mi Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar" className="cursor-pointer inline-flex items-center gap-2 text-sm border rounded-md px-3 py-2 hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Subiendo..." : "Cambiar foto"}
                </Label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Correo</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dejar vacío para mantener la actual"
              />
            </div>

            <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
