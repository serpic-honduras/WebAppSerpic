-- Remove the permissive policy that let any signed-in user read every role
DROP POLICY IF EXISTS "Authenticated can view roles" ON public.roles;

-- Only admins may read the roles table directly
CREATE POLICY "Admins can view roles"
ON public.roles
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

-- Non-admins get ONLY their own roles' permissions via a security definer function,
-- so the app can still load each user's permission matrix without exposing all roles.
CREATE OR REPLACE FUNCTION public.get_my_permissions()
RETURNS TABLE (key text, permissions jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.key, r.permissions
  FROM public.roles r
  WHERE r.key IN (
    SELECT ur.role::text
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_my_permissions() TO authenticated;