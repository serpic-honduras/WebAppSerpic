import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ALL_PERMISSION_KEYS,
  PERMISSION_GROUPS,
  PermissionKey,
  PermissionMatrix,
  emptyMatrix,
} from "@/lib/permissions";

const fullMatrix = (): PermissionMatrix =>
  ALL_PERMISSION_KEYS.reduce((acc, k) => ({ ...acc, [k]: true }), {} as PermissionMatrix);


type RoleRow = {
  id: string;
  key: string;
  name: string;
  is_system: boolean;
  permissions: PermissionMatrix;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const RolesManager = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [name, setName] = useState("");
  const [matrix, setMatrix] = useState<PermissionMatrix>(emptyMatrix());

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("roles")
      .select("id, key, name, is_system, permissions")
      .order("name");
    if (error) {
      toast({ title: "Error al cargar roles", description: error.message, variant: "destructive" });
    } else {
      setRoles(
        (data ?? []).map((r: any) => ({
          ...r,
          permissions: (r.permissions ?? {}) as PermissionMatrix,
        }))
      );
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setMatrix(emptyMatrix());
    setOpen(true);
  };

  const openEdit = (role: RoleRow) => {
    setEditing(role);
    setName(role.name);
    // El rol Administrador siempre conserva todos los permisos
    setMatrix(role.key === "admin" ? fullMatrix() : { ...emptyMatrix(), ...role.permissions });
    setOpen(true);
  };

  const isAdminRole = editing?.key === "admin";

  const toggle = (key: PermissionKey) => {
    if (isAdminRole) return;
    setMatrix((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGroup = (keys: PermissionKey[], value: boolean) => {
    if (isAdminRole) return;
    setMatrix((prev) => {
      const next = { ...prev };
      keys.forEach((k) => (next[k] = value));
      return next;
    });
  };


  const save = async () => {
    if (!name.trim()) {
      toast({ title: "El nombre del rol es obligatorio", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("roles")
          .update({
            name: name.trim(),
            permissions: (isAdminRole ? fullMatrix() : matrix) as any,
          })

          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const key = slugify(name);
        if (!key) throw new Error("Nombre de rol inválido");
        const { error } = await supabase
          .from("roles")
          .insert({ key, name: name.trim(), permissions: matrix as any, is_system: false });
        if (error) throw error;
      }
      toast({ title: editing ? "Rol actualizado" : "Rol creado" });
      setOpen(false);
      await load();
    } catch (e) {
      toast({
        title: "No se pudo guardar el rol",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (role: RoleRow) => {
    if (role.is_system) return;

    // Verificar que no existan usuarios asignados a este rol
    const { count, error: countError } = await supabase
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", role.key as any);

    if (countError) {
      toast({
        title: "No se pudo verificar usuarios asignados",
        description: countError.message,
        variant: "destructive",
      });
      return;
    }

    if ((count ?? 0) > 0) {
      toast({
        title: "No se puede eliminar el rol porque hay usuarios asignados a él. Reasígnalos primero",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`¿Eliminar el rol "${role.name}"?`)) return;
    const { error } = await supabase.from("roles").delete().eq("id", role.id);
    if (error) {
      toast({ title: "No se pudo eliminar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Rol eliminado" });
    load();
  };

  const countPerms = (p: PermissionMatrix) =>
    ALL_PERMISSION_KEYS.filter((k) => p[k]).length;


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Roles y Permisos
          </h3>
          <p className="text-sm text-muted-foreground">
            Define qué puede ver y editar cada rol en el sistema.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Rol
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rol</TableHead>
            <TableHead>Clave</TableHead>
            <TableHead className="text-center">Permisos activos</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Cargando...
              </TableCell>
            </TableRow>
          )}
          {!loading &&
            roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {role.name}
                    {role.is_system ? (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" /> Sistema
                      </Badge>
                    ) : (
                      <Badge variant="outline">Personalizado</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{role.key}</TableCell>
                <TableCell className="text-center">
                  {countPerms(role.permissions)} / {ALL_PERMISSION_KEYS.length}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(role)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {role.is_system ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Button variant="ghost" size="icon" disabled>
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Los roles nativos del sistema no se pueden borrar
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => remove(role)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>

              </TableRow>
            ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Editar rol: ${editing.name}` : "Nuevo Rol"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Nombre del rol</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Supervisor de Obra"
                disabled={!!editing?.is_system}
              />
            </div>

            <Separator />

            {isAdminRole && (
              <p className="text-sm text-muted-foreground">
                El rol Administrador conserva siempre todos los permisos del sistema.
              </p>
            )}

            <div className="space-y-5">
              {PERMISSION_GROUPS.map((group) => {
                const keys = group.items.map((i) => i.key);
                const allOn = keys.every((k) => matrix[k]);
                return (
                  <div key={group.module} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{group.module}</p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        disabled={isAdminRole}
                        onClick={() => toggleGroup(keys, !allOn)}
                      >
                        {allOn ? "Quitar todos" : "Marcar todos"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {group.items.map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2 text-sm rounded-md border border-border px-3 py-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={!!matrix[item.key]}
                            disabled={isAdminRole}
                            onCheckedChange={() => toggle(item.key)}
                          />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesManager;
