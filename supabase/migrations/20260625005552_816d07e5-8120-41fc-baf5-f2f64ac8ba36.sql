
-- Optimize RLS by wrapping auth functions in SELECT so Postgres caches per-statement,
-- preventing per-row re-evaluation that causes statement timeouts.
DROP POLICY IF EXISTS "Users view own or admin views all" ON public.projects;
CREATE POLICY "Users view own or admin views all" ON public.projects
FOR SELECT TO authenticated
USING (((SELECT auth.uid()) = user_id) OR private.has_role((SELECT auth.uid()), 'admin'::app_role));

DROP POLICY IF EXISTS "Users update own or admin updates all" ON public.projects;
CREATE POLICY "Users update own or admin updates all" ON public.projects
FOR UPDATE TO authenticated
USING (((SELECT auth.uid()) = user_id) OR private.has_role((SELECT auth.uid()), 'admin'::app_role));

DROP POLICY IF EXISTS "Users delete own or admin deletes all" ON public.projects;
CREATE POLICY "Users delete own or admin deletes all" ON public.projects
FOR DELETE TO authenticated
USING (((SELECT auth.uid()) = user_id) OR private.has_role((SELECT auth.uid()), 'admin'::app_role));

-- Index used by the dashboard list ordering
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS projects_start_order_created_idx
  ON public.projects(start_order_date DESC NULLS LAST, created_at DESC);
