## Plan: Currency formatting, tab persistence, and interconnected cost logic

### 1. Global currency input formatting
- Create a new reusable `CurrencyInput` component (`src/components/ui/currency-input.tsx`) that:
  - Displays values with thousands separators (`1,450,300.00`) in real time as the user types.
  - Stores/emits the clean numeric value via `onChange(value: number)`.
  - Allows decimals, handles blur/focus formatting, and works as a drop-in for current `<Input type="number">` money fields.
- Replace `<Input type="number">` with `<CurrencyInput>` in the cost-related sections:
  - `CostBreakdownSection.tsx`
  - `SubcontratosSection.tsx`
  - `RegistroGastosSection.tsx` (new form)
  - `BasicInformationSection.tsx` financial fields (Monto Inicial L, Monto Final, etc.)
- Database values remain raw numbers — only the visual layer changes.

### 2. Tab persistence on refresh
- In `ProjectFormTabs.tsx`, convert the `Tabs` to controlled mode with `value` / `onValueChange`.
- Persist the active tab in `sessionStorage` under a key per project id (`project-tab:<id>` or `project-tab:new`) and restore on mount.

### 3. Edit flow optimization
- Rename "Activar Edición" → "Editar" in the `EditToggle` component.
- Add an `onSubmit` Enter-key handler: when in edit mode, pressing Enter inside an input triggers the form's submit.
- After clicking "Actualizar Proyecto" and the save promise resolves, automatically flip the section back to read-only mode. Achieved by lifting the save callback to also reset `editBasic` / `editPresupuestado` to `false` via a small event/prop passed down from `ProjectForm.tsx`.

### 4. Costo Presupuestado changes
- In `CostBreakdownSection.tsx`:
  - Make **Utilidad (L)** an editable manual input (remove auto-derive logic).
  - **Total Costo Directo** = `costoIndirectoObra + fianzas + seguros + administracion + escalatorias + imprevistos + financieros + utilidad` (8 fields).
  - Rename the final comparison row to **"Monto de Proyecto - Total Costo Directo"** = `montoProyecto - totalCostoDirecto`; keep negative-in-red styling.

### 5. Subcontratos — CRUD + derived totals
- Extend `Subcontrato` type to: `{ id: string; nombre: string; descripcion: string; monto: number }` (rename `concepto`→`descripcion`; add `id` via `crypto.randomUUID()`).
- In `useProjectForm.ts`, when initializing a NEW project, seed `subcontratos` with a default `{ id, nombre: "Admin Serpic", descripcion: "Gastos internos", monto: 0 }`. For existing projects without it, inject it on load if missing.
- In `SubcontratosSection.tsx`:
  - Form on top to add a new subcontratista.
  - Below: table with columns **Nombre | Descripción | Monto de Subcontrato | Monto Pagado | Monto Adeudado | Acciones**.
  - `Monto Pagado` per subcontratista = `Σ gastos.montoPagado` where `gasto.subcontratistaId === sub.id` (read from `formData.gastos`).
  - `Monto Adeudado` = `monto - montoPagado`.
  - Row click → opens a detail screen (see step 7).

### 6. Registro de Gastos — expense form
- New type `Gasto`: `{ id: string; fecha: string; descripcion: string; montoPagado: number; subcontratistaId: string; tipoGasto: TipoGasto; subcategoriaCostoDirecto?: 'Abono a contrato' | 'Materiales' | 'Planilla' }`.
- Store in `formData.gastos: Gasto[]` (new JSONB field on the project — see migration below).
- Build `RegistroGastosSection.tsx` form:
  - Inputs: Fecha (date), Descripción, Monto Pagado (CurrencyInput), Subcontratista select (lists Admin Serpic + others), Tipo de Gasto select (enabled after subcontratista picked) with the 8 options, and a third select for subcategoría only when Tipo = "Costo Directo".
  - Below the form: a list/table of registered gastos with delete action.
- Real-time impact on Costo Dinámico:
  - In `CostoDinamicoSection.tsx`, compute per-bucket sums from `formData.gastos` and inject them into the corresponding fields (read-only / auto-filled). The "Costo Directo" bucket = sum of all gastos with `tipoGasto === 'Costo Directo'` (any subcategoría) PLUS the existing subcontratos-sum injection rule already in place.

### 7. Subcontratista detail view
- New component `SubcontratistaDetail.tsx` rendered as a modal/dialog (or inline panel) from `SubcontratosSection.tsx` on row click.
- Shows: Nombre, Descripción, Monto de Subcontrato.
- Monto Pagado breakdown by subcategoría when `tipoGasto === 'Costo Directo'`:
  - Abono a contrato = Σ
  - Materiales = Σ
  - Planilla = Σ
- Monto Adeudado = `monto - (abono + materiales + planilla)` per the spec.

### 8. Persistence (database)
Single migration adding two JSONB columns to `projects`:
- `gastos jsonb default '[]'::jsonb`
- (subcontratos already stored in existing JSONB column — verify and reuse; if not, add `subcontratos jsonb default '[]'::jsonb`.)

`projectTransforms.ts` updated to map `gastos` <-> DB and to ensure the Admin Serpic default exists on load.

### Files
**Create**: `src/components/ui/currency-input.tsx`, `src/components/project-form/SubcontratistaDetail.tsx`
**Edit**: `ProjectFormTabs.tsx`, `ProjectForm.tsx`, `CostBreakdownSection.tsx`, `SubcontratosSection.tsx`, `RegistroGastosSection.tsx`, `CostoDinamicoSection.tsx`, `BasicInformationSection.tsx`, `useProjectForm.ts`, `project.ts`, `projectTransforms.ts`
**Migration**: add `gastos` (and `subcontratos` if missing) JSONB columns to `projects`.

### Open questions before I build
1. **Default Admin Serpic**: should it be undeletable (locked row) and have its `monto` editable, or fully fixed at 0?
2. **Costo Dinámico fields fed from gastos**: should those fields become fully read-only (auto-calculated, no manual editing), or remain editable with the gastos-sum shown as a hint?
3. **Subcontratista detail**: open as a modal dialog over the form, or as a separate route/page?
