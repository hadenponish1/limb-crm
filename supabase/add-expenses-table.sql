-- Limb CRM — expenses table
-- Run once in Supabase: SQL Editor → paste → Run.
-- Backs the Expenses tab (one-off + recurring costs) and the net-profit metrics.

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount numeric not null default 0,
  category text,
  date date not null,               -- one-off: when it happened; recurring: start/anchor date
  vendor text,                      -- who it was paid to / short description
  note text,
  client_id uuid references clients (id) on delete set null,  -- optional job/client link
  job_id uuid references jobs (id) on delete set null,        -- (kept if the client/job is later deleted)
  recurring boolean not null default false,
  frequency jsonb,                  -- {every, unit} when recurring, else null
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_id_idx on expenses (user_id);
create index if not exists expenses_client_id_idx on expenses (client_id);

alter table expenses enable row level security;

create policy "own expenses" on expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
