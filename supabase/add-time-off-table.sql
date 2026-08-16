-- Limb CRM — time_off table
-- Run once in Supabase: SQL Editor → paste → Run.
-- Backs the calendar "time off" blocks (vacation / holiday / personal / weather days).

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

create policy "own time_off" on time_off
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
