-- Fires n8n on every jobs change, with the SAME payload shape Supabase Database
-- Webhooks use ({ type, table, record, old_record }). Use this if the Webhooks UI
-- errors with "schema supabase_functions does not exist".
--
-- 1) enable pg_net (Database -> Extensions -> pg_net), or run the line below
-- 2) replace the URL with your n8n Webhook *Production* URL
-- 3) run this whole script once

create extension if not exists pg_net;

create or replace function notify_job_change()
returns trigger language plpgsql security definer set search_path = public, net
as $$
begin
  perform net.http_post(
    url := 'https://YOUR-N8N-WEBHOOK-PRODUCTION-URL',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'type', tg_op,                                                    -- INSERT | UPDATE | DELETE
      'table', 'jobs',
      'record', case when tg_op = 'DELETE' then null else to_jsonb(new) end,
      'old_record', case when tg_op = 'INSERT' then null else to_jsonb(old) end
    )
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists jobs_gcal_sync on jobs;
create trigger jobs_gcal_sync
  after insert or update or delete on jobs
  for each row execute function notify_job_change();
