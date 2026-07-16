# Google Calendar sync

Two-way-ish sync between the app's `jobs` and a dedicated **"Limb Jobs"** Google
Calendar (under haden@limbrva.com), orchestrated by n8n + Supabase change events.

## Phase 1 — App → Google (this doc)

Every job change in the app (create, edit, drag-reschedule, cadence reschedule,
delete) flows automatically to Google Calendar. No app code involved — it rides on
Supabase row changes.

### 1. Schema
Run `supabase/add-gcal-event-id.sql` once (adds `jobs.gcal_event_id`).

### 2. Create the calendar + get its ID
- Google Calendar → **Other calendars → + → Create new calendar** → name it "Limb Jobs".
- Open its **Settings** → **Integrate calendar** → copy the **Calendar ID**
  (looks like `abc123...@group.calendar.google.com`).

### 3. Supabase → n8n webhook
In Supabase: **Database → Webhooks → Create a new hook**
- Table: `jobs`
- Events: **Insert, Update, Delete**
- Type: **HTTP Request** → POST to your n8n webhook URL (from step 4's Webhook node)
- (Supabase sends `{ type, table, record, old_record, schema }` as the JSON body.)

### 4. n8n workflow: "Job → Google Calendar"

**Webhook** (trigger) → **Switch** on `{{ $json.body.type }}`:

**DELETE**
- Only if `{{ $json.body.old_record.gcal_event_id }}` is set →
  **Google Calendar → Delete Event** (Calendar = Limb Jobs, Event ID = that value).

**INSERT**
1. **Supabase → Get a row** from `clients` where `id = {{ $json.body.record.client_id }}`
   (for name / address / phone).
2. **Google Calendar → Create Event** (Calendar = Limb Jobs):
   - Start: `{{ $json.body.record.date }}T{{ $json.body.record.time }}:00`, TZ `America/New_York`
   - End: start + `{{ $json.body.record.duration }}` minutes
   - Summary: `{{ client.name }} — {{ $json.body.record.title }}`
   - Location: `{{ client.address }}`
   - Description: amount / phone as you like
3. **Supabase → Update** `jobs` set `gcal_event_id = {{ event id from step 2 }}`
   where `id = {{ $json.body.record.id }}`.

**UPDATE**
- If `record.gcal_event_id` is empty → do the INSERT branch (event was never created).
- Else if `record.gcal_event_id != old_record.gcal_event_id` → **STOP** (this is our own
  write-back from step 3 — ignoring it is what prevents an infinite loop).
- Else → **Google Calendar → Update Event** (Event ID = `record.gcal_event_id`) with the
  new start/end/summary/location (same mapping as INSERT step 2).

### The loop guard (important)
When n8n writes `gcal_event_id` back (INSERT step 3), that itself is an UPDATE that
re-fires the webhook. The `record.gcal_event_id != old_record.gcal_event_id` check in the
UPDATE branch catches that and stops — otherwise you'd loop forever.

### Test
Create a job in the app → it appears on the Limb Jobs calendar within seconds. Drag it to a
new time in the app → the calendar event moves. Delete it → the event disappears.

## Phase 2 — Google → App (later)
n8n **Google Calendar Trigger** (poll the Limb Jobs calendar ~1 min) → match event to a job
by `gcal_event_id` → update the job's date/time/title. Scope: **edits to app-created jobs
only** (new events created directly in Google are ignored). Needs a matching loop-guard so
a pulled-in change doesn't get pushed straight back out (skip if content already matches).
