-- Phase 1 of Google Calendar sync. Run once in Supabase (SQL Editor).
-- Links each job to its Google Calendar event so updates/deletes map correctly
-- (instead of creating duplicates). Managed entirely by n8n — the app never
-- touches this column.
alter table jobs add column if not exists gcal_event_id text;
