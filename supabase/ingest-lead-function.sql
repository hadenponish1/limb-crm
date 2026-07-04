-- Run once in Supabase (SQL Editor). Lets n8n push a TaskRabbit lead in one call:
-- it finds-or-creates the client (deduped by address) and adds the job, skipping
-- duplicates if the same lead comes in twice.
--
-- Call it from n8n via POST https://<project>.supabase.co/rest/v1/rpc/ingest_lead
-- with a JSON body of the p_* params below (see notes at bottom).

create or replace function ingest_lead(
  p_user_id uuid,
  p_address text,
  p_date date,
  p_name text default null,
  p_time text default '08:00',
  p_duration integer default 60,
  p_amount numeric default 0,
  p_title text default 'Job',
  p_source text default 'TaskRabbit',
  p_lat double precision default null,
  p_lng double precision default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_job_id uuid;
  -- normalize the address for matching: lowercase, drop trailing ", USA", collapse spaces
  v_norm text := lower(regexp_replace(regexp_replace(coalesce(p_address, ''), ',?\s*usa\s*$', '', 'i'), '\s+', ' ', 'g'));
begin
  if v_norm = '' or p_date is null then
    raise exception 'p_address and p_date are required';
  end if;

  -- find an existing client at this address (for this user)
  select id into v_client_id
  from clients
  where user_id = p_user_id
    and lower(regexp_replace(regexp_replace(coalesce(address, ''), ',?\s*usa\s*$', '', 'i'), '\s+', ' ', 'g')) = v_norm
  order by created_at
  limit 1;

  -- create the client if new
  if v_client_id is null then
    insert into clients (user_id, name, address, status, source, lat, lng)
    values (p_user_id, coalesce(nullif(p_name, ''), split_part(p_address, ',', 1)), p_address, 'lead', p_source, p_lat, p_lng)
    returning id into v_client_id;
  end if;

  -- skip if an identical job (same client/date/time) already exists — makes re-runs safe
  select id into v_job_id
  from jobs
  where user_id = p_user_id and client_id = v_client_id and date = p_date and time = p_time
  limit 1;
  if v_job_id is not null then
    return v_job_id;
  end if;

  insert into jobs (user_id, client_id, title, date, time, duration, amount, type)
  values (p_user_id, v_client_id, p_title, p_date, p_time, p_duration, p_amount, 'project')
  returning id into v_job_id;

  return v_job_id;
end;
$$;

grant execute on function ingest_lead to service_role;

-- ---------------------------------------------------------------------------
-- n8n HTTP Request node:
--   Method:  POST
--   URL:     https://<your-project-ref>.supabase.co/rest/v1/rpc/ingest_lead
--   Headers: apikey: <SERVICE_ROLE key>      (Settings → API → service_role — SECRET)
--            Authorization: Bearer <SERVICE_ROLE key>
--            Content-Type: application/json
--   Body (JSON):
--   {
--     "p_user_id": "<your auth user UUID>",   -- Authentication → Users → your user → copy ID
--     "p_name":    "{{ client name, if parsed }}",
--     "p_address": "{{ property address }}",
--     "p_date":    "{{ YYYY-MM-DD }}",
--     "p_time":    "{{ HH:MM 24h }}",
--     "p_duration":{{ minutes, e.g. 60 }},
--     "p_amount":  0,
--     "p_title":   "{{ job description }}",
--     "p_source":  "TaskRabbit"
--   }
-- The function returns the new job's id. Only p_user_id, p_address, p_date are required.
-- ---------------------------------------------------------------------------
