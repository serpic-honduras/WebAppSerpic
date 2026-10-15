CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view roles" ON public.roles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins insert roles" ON public.roles
FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update roles" ON public.roles
FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete non system roles" ON public.roles
FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role) AND is_system = false);

CREATE TRIGGER roles_updated_at BEFORE UPDATE ON public.roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.roles (key, name, is_system, permissions) VALUES
('admin', 'Administrador', true, '{"projects.view":true,"projects.edit":true,"projects.delete":true,"bi.view":true,"costs.view":true,"costs.edit":true,"estimations.view":true,"estimations.edit":true,"estimations.delete":true,"subcontracts.view":true,"subcontracts.edit":true,"expenses.view":true,"expenses.edit":true,"settings.access":true,"settings.manage_users":true}'::jsonb),
('user', 'Gestor', true, '{"projects.view":true,"projects.edit":true,"projects.delete":false,"bi.view":true,"costs.view":true,"costs.edit":true,"estimations.view":true,"estimations.edit":true,"estimations.delete":false,"subcontracts.view":true,"subcontracts.edit":true,"expenses.view":true,"expenses.edit":true,"settings.access":false,"settings.manage_users":false}'::jsonb),
('auditor', 'Auditor', true, '{"projects.view":true,"projects.edit":false,"projects.delete":false,"bi.view":true,"costs.view":true,"costs.edit":false,"estimations.view":true,"estimations.edit":false,"estimations.delete":false,"subcontracts.view":true,"subcontracts.edit":false,"expenses.view":true,"expenses.edit":false,"settings.access":false,"settings.manage_users":false}'::jsonb),
('moderator', 'Moderador', true, '{"projects.view":true,"projects.edit":true,"projects.delete":false,"bi.view":true,"costs.view":true,"costs.edit":true,"estimations.view":true,"estimations.edit":true,"estimations.delete":false,"subcontracts.view":true,"subcontracts.edit":true,"expenses.view":true,"expenses.edit":true,"settings.access":false,"settings.manage_users":false}'::jsonb);