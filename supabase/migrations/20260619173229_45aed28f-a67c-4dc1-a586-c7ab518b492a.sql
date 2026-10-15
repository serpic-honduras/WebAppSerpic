-- 1) Lock down internal trigger functions: only the database (trigger context) needs to run them.
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2) Harden has_role: restrict to checking own role unless caller is already an admin.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow callers to check their own role, unless they are admin checking someone else.
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF _user_id <> auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$function$;

-- 3) Allow users to delete their own access codes.
DROP POLICY IF EXISTS "Users can delete their own access codes" ON public.project_access_codes;
CREATE POLICY "Users can delete their own access codes"
ON public.project_access_codes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4) Restrict avatars bucket reads to the owner's folder.
DROP POLICY IF EXISTS "Avatars auth read" ON storage.objects;
CREATE POLICY "Users read own avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);