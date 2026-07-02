-- Run this once in Supabase (SQL Editor) to add the "source" field to an
-- existing clients table (TaskRabbit / Referral / etc.). Safe to run more than once.
alter table clients add column if not exists source text;
