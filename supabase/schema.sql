-- Limb CRM — Supabase schema
-- Run this once in your Supabase project: SQL Editor → paste → Run.

-- ---------- Tables ----------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  contact text,
  email text,
  phone text,
  address text,
  lat double precision,
  lng double precision,
  status text not null default 'lead',
  source text,
  services jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  service_id text,
  title text,
  date date not null,
  time text,
  duration integer,
  amount numeric,
  type text,
  recurring boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists jobs_client_id_idx on jobs (client_id);
create index if not exists clients_user_id_idx on clients (user_id);
create index if not exists jobs_user_id_idx on jobs (user_id);

-- ---------- Row Level Security ----------
-- Each signed-in user can only see and touch their own rows.
alter table clients enable row level security;
alter table jobs enable row level security;

create policy "own clients" on clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own jobs" on jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
