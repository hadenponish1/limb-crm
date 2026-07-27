-- Run once in Supabase (SQL Editor). Adds a tasks/reminders list to each client
-- (e.g. "Send patio estimate", "Follow up re: mulch"), stored as JSONB:
--   [{ id, text, due, done, createdAt, doneAt }]
alter table clients add column if not exists tasks jsonb not null default '[]'::jsonb;
