
-- Roles enum + table
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  client text not null,
  project_manager_name text not null default '',
  project_manager_email text not null default '',
  project_manager_phone text not null default '',
  start_date date,
  finish_date date,
  estimated_completion date,
  contract_amount numeric not null default 0,
  monthly_expenses numeric not null default 0,
  project_type text not null default '',
  performance_bond numeric not null default 0,
  payment_bond numeric not null default 0,
  general_liability numeric not null default 0,
  workers_comp numeric not null default 0,
  status text not null default 'Planning',
  photos jsonb not null default '{}'::jsonb,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users can view their own projects"
on public.projects for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own projects"
on public.projects for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own projects"
on public.projects for update to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own projects"
on public.projects for delete to authenticated
using (auth.uid() = user_id);

create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
before update on public.projects
for each row execute function public.update_updated_at_column();

-- Monthly estimations
create table public.monthly_estimations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  month text not null,
  monto_bruto numeric not null default 0,
  devolucion_anticipo numeric not null default 0,
  retencion_calidad numeric not null default 0,
  otras_deducciones numeric not null default 0,
  total_neto_recibido numeric not null default 0,
  status text not null default 'En Conciliación',
  created_at timestamptz not null default now()
);

alter table public.monthly_estimations enable row level security;

create policy "Users can view estimations of their projects"
on public.monthly_estimations for select to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create policy "Users can insert estimations for their projects"
on public.monthly_estimations for insert to authenticated
with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create policy "Users can update estimations of their projects"
on public.monthly_estimations for update to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create policy "Users can delete estimations of their projects"
on public.monthly_estimations for delete to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

-- Project access codes
create table public.project_access_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  access_code text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.project_access_codes enable row level security;

create policy "Users can view their own access codes"
on public.project_access_codes for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own access codes"
on public.project_access_codes for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own access codes"
on public.project_access_codes for update to authenticated
using (auth.uid() = user_id);
