
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;
