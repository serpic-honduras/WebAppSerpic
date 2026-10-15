
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS contract_number text,
  ADD COLUMN IF NOT EXISTS consortium text,
  ADD COLUMN IF NOT EXISTS work_type text,
  ADD COLUMN IF NOT EXISTS initial_amount numeric,
  ADD COLUMN IF NOT EXISTS initial_term_days integer,
  ADD COLUMN IF NOT EXISTS start_order_date date,
  ADD COLUMN IF NOT EXISTS client_phone text,
  ADD COLUMN IF NOT EXISTS client_contact_name text,
  ADD COLUMN IF NOT EXISTS client_email text,
  ADD COLUMN IF NOT EXISTS construction_m2 numeric,
  ADD COLUMN IF NOT EXISTS activities_description text,
  ADD COLUMN IF NOT EXISTS final_reception_date date,
  ADD COLUMN IF NOT EXISTS final_term_days integer,
  ADD COLUMN IF NOT EXISTS final_duration_months numeric,
  ADD COLUMN IF NOT EXISTS execution_year integer,
  ADD COLUMN IF NOT EXISTS final_amount_hnl numeric,
  ADD COLUMN IF NOT EXISTS project_exchange_rate numeric,
  ADD COLUMN IF NOT EXISTS final_amount_usd numeric;

ALTER TABLE public.projects
  ALTER COLUMN project_manager_name DROP NOT NULL,
  ALTER COLUMN project_manager_email DROP NOT NULL,
  ALTER COLUMN project_manager_phone DROP NOT NULL,
  ALTER COLUMN project_type DROP NOT NULL;
