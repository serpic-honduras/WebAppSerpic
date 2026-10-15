export type PermissionKey =
  | "projects.view"
  | "projects.edit"
  | "projects.delete"
  | "bi.view"
  | "costs.view"
  | "costs.edit"
  | "estimations.view"
  | "estimations.edit"
  | "estimations.delete"
  | "subcontracts.view"
  | "subcontracts.edit"
  | "expenses.view"
  | "expenses.edit"
  | "settings.access"
  | "settings.manage_users";

export type PermissionMatrix = Partial<Record<PermissionKey, boolean>>;

export interface PermissionGroup {
  module: string;
  items: { key: PermissionKey; label: string }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    module: "Proyectos",
    items: [
      { key: "projects.view", label: "Ver Proyectos" },
      { key: "projects.edit", label: "Crear/Editar Proyectos" },
      { key: "projects.delete", label: "Eliminar Proyectos" },
    ],
  },
  {
    module: "Resumen / BI (Dashboard)",
    items: [{ key: "bi.view", label: "Ver Métricas y Gráficos" }],
  },
  {
    module: "Pestañas de Costos (Presupuestado, Dinámico, Diferencial)",
    items: [
      { key: "costs.view", label: "Ver Costos" },
      { key: "costs.edit", label: "Editar Costos / Guardar" },
    ],
  },
  {
    module: "Estimaciones / Control de Pagos",
    items: [
      { key: "estimations.view", label: "Ver Estimaciones" },
      { key: "estimations.edit", label: "Crear/Editar Estimaciones" },
      { key: "estimations.delete", label: "Aprobar/Eliminar" },
    ],
  },
  {
    module: "Subcontratos y Anticipos",
    items: [
      { key: "subcontracts.view", label: "Ver Subcontratos" },
      { key: "subcontracts.edit", label: "Crear/Editar Subcontratos" },
    ],
  },
  {
    module: "Gastos / Control Financiero",
    items: [
      { key: "expenses.view", label: "Ver Gastos" },
      { key: "expenses.edit", label: "Registrar/Editar Gastos" },
    ],
  },
  {
    module: "Configuración del Sistema",
    items: [
      { key: "settings.access", label: "Acceso a Configuraciones" },
      { key: "settings.manage_users", label: "Gestionar Usuarios y Roles" },
    ],
  },
];

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_GROUPS.flatMap((g) =>
  g.items.map((i) => i.key)
);

export const emptyMatrix = (): PermissionMatrix =>
  ALL_PERMISSION_KEYS.reduce((acc, k) => ({ ...acc, [k]: false }), {} as PermissionMatrix);

export const readOnlyMatrix = (): PermissionMatrix => ({
  ...emptyMatrix(),
  "projects.view": true,
  "bi.view": true,
  "costs.view": true,
  "estimations.view": true,
  "subcontracts.view": true,
  "expenses.view": true,
});

export const mergeMatrices = (matrices: PermissionMatrix[]): PermissionMatrix => {
  const merged = emptyMatrix();
  for (const m of matrices) {
    for (const k of ALL_PERMISSION_KEYS) {
      if (m?.[k]) merged[k] = true;
    }
  }
  return merged;
};
