-- Limb CRM — combined migration for the Expenses tab and calendar Time-off blocks.
-- Run once in Supabase: SQL Editor → paste → Run. Safe to re-run (idempotent).

-- ========== expenses ==========
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount numeric not null default 0,
  category text,
  date date not null,               -- one-off: when it happened; recurring: start/anchor date
  vendor text,                      -- who it was paid to / short description
  note text,
  client_id uuid references clients (id) on delete set null,  -- optional job/client link
  job_id uuid references jobs (id) on delete set null,
  recurring boolean not null default false,
  frequency jsonb,                  -- {every, unit} when recurring, else null
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_id_idx on expenses (user_id);
create index if not exists expenses_client_id_idx on expenses (client_id);

alter table expenses enable row level security;
drop policy if exists "own expenses" on expenses;
create policy "own expenses" on expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ========== time_off ==========
create table if not exists time_off (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text,                       -- optional label, e.g. "Beach trip"
  type text not null default 'vacation',  -- vacation | holiday | personal | weather
  start_date date not null,
  end_date date not null,           -- inclusive last day off
  created_at timestamptz not null default now()
);

create index if not exists time_off_user_id_idx on time_off (user_id);

alter table time_off enable row level security;
drop policy if exists "own time_off" on time_off;
create policy "own time_off" on time_off
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
