
-- 1. Private schema for internal helpers (not exposed via Data API)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- 2. Recreate has_role in private schema
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF _user_id <> auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::public.app_role
  ) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 3. Recreate policies to use private.has_role
-- projects
DROP POLICY IF EXISTS "Users view own or admin views all" ON public.projects;
DROP POLICY IF EXISTS "Users update own or admin updates all" ON public.projects;
DROP POLICY IF EXISTS "Users delete own or admin deletes all" ON public.projects;

CREATE POLICY "Users view own or admin views all" ON public.projects
FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users update own or admin updates all" ON public.projects
FOR UPDATE TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users delete own or admin deletes all" ON public.projects
FOR DELETE TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- user_roles
DROP POLICY IF EXISTS "Admins manage user_roles" ON public.user_roles;
CREATE POLICY "Admins manage user_roles" ON public.user_roles
FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- profiles
DROP POLICY IF EXISTS "Users view own profile or admin all" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile or admin all" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;

CREATE POLICY "Users view own profile or admin all" ON public.profiles
FOR SELECT TO authenticated
USING ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users update own profile or admin all" ON public.profiles
FOR UPDATE TO authenticated
USING ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. Drop the public copy now that nothing depends on it
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
