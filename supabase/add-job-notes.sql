-- Run once in Supabase (SQL Editor). Adds a free-text notes field to jobs so you
-- can jot per-visit details ("mulch front beds, pull weeds in back", gate code, etc.).
alter table jobs add column if not exists notes text;
