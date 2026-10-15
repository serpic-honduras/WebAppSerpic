import { useEffect, useState } from "react";
import { Plus, Trash2, KeyRound, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ManagedUser = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "auditor" | "user";
  created_at: string;
};

const callAdmin = async (body: unknown) => {
  const { data, error } = await supabase.functions.invoke("admin-users", { body });
  if (error) throw error;
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data;
};

const UsersManager = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [pwUser, setPwUser] = useState<ManagedUser | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Create form
  const [cEmail, setCEmail] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cName, setCName] = useState("");
  const [cRole, setCRole] = useState<"admin" | "auditor" | "user">("user");
  const [newPw, setNewPw] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = (await callAdmin({ action: "list" })) as { users: ManagedUser[] };
      setUsers(data.users);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    try {
      await callAdmin({
        action: "create",
        email: cEmail,
        password: cPassword,
        full_name: cName,
        role: cRole,
      });
      toast({ title: "Usuario creado" });
      setCreateOpen(false);
      setCEmail(""); setCPassword(""); setCName(""); setCRole("user");
      load();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleRoleChange = async (u: ManagedUser, role: "admin" | "auditor" | "user") => {
    try {
      await callAdmin({ action: "set_role", user_id: u.id, role });
      toast({ title: "Rol actualizado" });
      load();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleSaveName = async (u: ManagedUser) => {
    try {
      await callAdmin({ action: "update_name", user_id: u.id, full_name: editName });
      toast({ title: "Nombre actualizado" });
      setEditingId(null);
      load();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handlePassword = async () => {
    if (!pwUser || !newPw) return;
    try {
      await callAdmin({ action: "update_password", user_id: pwUser.id, password: newPw });
      toast({ title: "Contraseña actualizada" });
      setPwUser(null);
      setNewPw("");
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = async (u: ManagedUser) => {
    if (!confirm(`¿Eliminar usuario ${u.email}?`)) return;
    try {
      await callAdmin({ action: "delete", user_id: u.id });
      toast({ title: "Usuario eliminado" });
      load();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Usuarios</h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" /> Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader><DialogTitle>Crear Usuario</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre</Label><Input value={cName} onChange={(e) => setCName(e.target.value)} /></div>
              <div><Label>Correo</Label><Input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} /></div>
              <div><Label>Contraseña</Label><Input type="password" value={cPassword} onChange={(e) => setCPassword(e.target.value)} /></div>
              <div>
                <Label>Rol</Label>
                <Select value={cRole} onValueChange={(v) => setCRole(v as "admin" | "auditor" | "user")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="user">Gestor</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    {editingId === u.id ? (
                      <div className="flex gap-2 items-center">
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                        <Button size="icon" variant="ghost" onClick={() => handleSaveName(u)}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{u.full_name || "—"}</span>
                        <Button size="icon" variant="ghost" onClick={() => { setEditingId(u.id); setEditName(u.full_name); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(v) => handleRoleChange(u, v as "admin" | "auditor" | "user")}>
                      <SelectTrigger className="w-36 h-8">
                        <SelectValue>
                          <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                            {u.role === "admin" ? "Administrador" : u.role === "auditor" ? "Auditor" : "Gestor"}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="user">Gestor</SelectItem>
                        <SelectItem value="auditor">Auditor</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setPwUser(u)} title="Cambiar contraseña">
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(u)} title="Eliminar">
                      <Trash2 className="h-4 w-4 text-primary" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!pwUser} onOpenChange={(o) => !o && setPwUser(null)}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>Cambiar contraseña — {pwUser?.email}</DialogTitle></DialogHeader>
          <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Nueva contraseña" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwUser(null)}>Cancelar</Button>
            <Button onClick={handlePassword} className="bg-primary hover:bg-primary/90 text-primary-foreground">Actualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManager;
