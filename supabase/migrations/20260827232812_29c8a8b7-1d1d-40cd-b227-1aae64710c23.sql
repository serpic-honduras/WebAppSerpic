DROP POLICY IF EXISTS "Users view own or admin views all" ON public.projects;
CREATE POLICY "Users view own or admin or auditor views all"
ON public.projects FOR SELECT TO authenticated
USING (
  (( SELECT auth.uid() ) = user_id)
  OR private.has_role(( SELECT auth.uid() ), 'admin'::app_role)
  OR private.has_role(( SELECT auth.uid() ), 'auditor'::app_role)
);

DROP POLICY IF EXISTS "Users can view estimations of their projects" ON public.monthly_estimations;
CREATE POLICY "Users view estimations of own projects or admin or auditor"
ON public.monthly_estimations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = monthly_estimations.project_id
      AND p.user_id = ( SELECT auth.uid() )
  )
  OR private.has_role(( SELECT auth.uid() ), 'admin'::app_role)
  OR private.has_role(( SELECT auth.uid() ), 'auditor'::app_role)
);