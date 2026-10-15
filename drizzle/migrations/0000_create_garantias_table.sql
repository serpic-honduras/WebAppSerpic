CREATE TABLE public.garantias (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  numero_garantia text not null default '',
  vigencia_inicio date,
  vigencia_fin date,
  monto numeric not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.garantias TO authenticated;
GRANT ALL ON public.garantias TO service_role;

ALTER TABLE public.garantias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view garantias of own projects or admin or auditor"
ON public.garantias
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = garantias.project_id AND p.user_id = auth.uid()
  )
  OR private.has_role(auth.uid(), 'admin'::app_role)
  OR private.has_role(auth.uid(), 'auditor'::app_role)
);

CREATE POLICY "Users insert garantias for their projects"
ON public.garantias
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = garantias.project_id AND p.user_id = auth.uid()
  )
  OR private.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users update garantias of their projects"
ON public.garantias
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = garantias.project_id AND p.user_id = auth.uid()
  )
  OR private.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = garantias.project_id AND p.user_id = auth.uid()
  )
  OR private.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users delete garantias of their projects"
ON public.garantias
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = garantias.project_id AND p.user_id = auth.uid()
  )
  OR private.has_role(auth.uid(), 'admin'::app_role)
);

CREATE TRIGGER garantias_updated_at
BEFORE UPDATE ON public.garantias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();