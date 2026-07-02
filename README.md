# Limb CRM — landscaping CRM & scheduling prototype

A lightweight CRM + scheduling tool for **Limb Landscaping & Design**. Built with React + Vite.
No backend required — data is seeded and persisted in your browser (`localStorage`).

## Run it

```bash
cd limb-crm
npm install
npm run dev      # opens http://localhost:5180
```

## What's in the prototype

- **Dashboard** — booked revenue this month, monthly recurring revenue (MRR), 6-month
  projection, active clients, client-mix bar, and upcoming schedule.
- **Schedule** — **month calendar view** (default) with a **List** toggle. Click any day to
  add a job; click a job to view details, push to Google Calendar, or export `.ics`.
  - **Scheduling a job** — pick a client, then choose **Recurring** or **One-off**:
    - *Recurring* saves (or reuses) a recurring service line and auto-generates its visits
      on the chosen cadence for the next 4/8/12 weeks.
    - *One-off* creates a single job and logs it as a **project line** on the client.
  - **Auto-fill recurring** — one button generates upcoming visits across **every** recurring
    service line on active clients. Shows a per-client preview and never duplicates existing visits.
- **Clients & Leads** — searchable/filterable list. Each client can hold **multiple service
  lines** (e.g. bi-weekly mow + monthly weeding + a quoted spring cleanup). **Click any row
  to open a side drawer** to edit contact info, add/edit/remove service lines, and **log
  timestamped notes** (site details, follow-ups, gate codes). Address edits re-geocode the pin.
  - Recurring lines roll up into the client's monthly total (MRR); project lines each carry
    their own **Quoted / Won** stage, so an active maintenance client can also hold an open quote.
  - The drawer has a **Schedule & jobs** section listing every job for that client (upcoming +
    completed, with a Google Calendar link each). Services and the calendar are fully linked:
    - **Schedule from the lead** — hit "Schedule job" (or "Schedule" on a service line) to drop a
      dated job straight onto the calendar without leaving the client.
    - **Schedule from the calendar** — a job created there shows back here as a job, and a one-off
      also creates the matching project service line. Same scheduler component drives both.
- **Map** — every property with an address is pinned on an OpenStreetMap map
  (color-coded: recurring / project / lead). New addresses are geocoded automatically.
- **Metrics** — **Revenue YTD** and this-month actuals, a month-by-month **actual (booked) vs
  projected** revenue chart (actuals come straight from the job history, so backfilled past
  jobs count), recurring vs project split, revenue by service line, and weighted pipeline.
  Projections net out project work already booked so contracts aren't double-counted.

### Recurring auto-generation (how it works)

Each recurring client has a cadence + preferred time. `visitsFor()` in `src/lib/store.js`
rolls forward from the client's start date to the next upcoming visit, then steps by the
frequency interval out to the chosen horizon. `previewRecurring(weeks)` counts what's new;
`generateRecurring(weeks)` creates them, skipping any `clientId|date` that already exists so
re-running is safe. Generated jobs are tagged `recurring: true` (shown with an "auto" badge).

## How the numbers work (`src/lib/metrics.js`)

- **MRR** = each active *recurring* client's per-visit price × visits/month
  (weekly = 4, bi-weekly = 2, monthly = 1 — whole visits, so the monthly total reflects
  what actually happens that month; annual is derived as MRR × 12).
- **Projected revenue** = MRR each month + active project value spread over 3 months +
  open project leads weighted at 40%.
- Tweak the weighting/spread assumptions in `projectRevenue()`.

## Google Calendar integration

The prototype uses Google's **event-template URL** — clicking "Google" opens Google
Calendar with the job pre-filled to save in one click (no login/setup needed). This is a
one-way push per event.

**For true two-way sync** (jobs auto-appear on your calendar, edits sync both ways) you'll
need the Google Calendar API with OAuth. That requires a small backend to hold credentials
securely — a natural next step once the prototype direction is locked in. See `src/lib/calendar.js`.

## Tech / where things live

```
src/
  App.jsx            # shell + nav
  lib/
    store.js         # seed data + localStorage store (edit seed clients/jobs here)
    metrics.js       # revenue & projection math
    calendar.js      # Google Calendar link + .ics export
    geocode.js       # address -> lat/lng (OpenStreetMap Nominatim)
    format.js        # money/date helpers
  views/             # Dashboard, Schedule, Clients, MapView, Metrics
  components/        # icons, shared UI, LeadModal
```

- Maps: **Google Maps if `VITE_GOOGLE_MAPS_API_KEY` is set, otherwise Leaflet + OpenStreetMap** (free, no key).
- Address entry: **Google Places autocomplete** on the New Lead form when a key is set
  (returns exact coordinates on select); falls back to a plain field geocoded via Nominatim.
- Charts: Recharts.

## Google Maps + address autocomplete (optional)

Off by default — the app uses the free OpenStreetMap map and a plain address field. To turn on
Google Maps and type-ahead address search:

1. In [Google Cloud Console](https://console.cloud.google.com/): create a project and **enable billing**
   (a card is required; there's a monthly free tier a small business stays well under).
2. Enable two APIs: **Maps JavaScript API** and **Places API (New)**.
3. Create an **API key** and restrict it to your domain (HTTP referrers).
4. `cp .env.example .env` and set `VITE_GOOGLE_MAPS_API_KEY=your_key`, then restart `npm run dev`.
   On Vercel, set the same variable in the project's Environment Variables instead.

Relevant files: `src/lib/googleMaps.js` (loader), `src/components/AddressAutocomplete.jsx`,
`src/components/GoogleMapView.jsx`. Everything degrades gracefully if the key is missing.

## Deploying with persistent data

The app currently stores data in the browser (`localStorage`). To make it multi-device with
real saved data + login, the recommended path:

- **Host:** push to GitHub → import into **Vercel** (auto-deploys the Vite app; free tier).
- **Data + auth:** **Supabase** (Postgres + built-in auth). Because all data access is isolated
  in `src/lib/store.js`, this is a contained swap: replace the localStorage reads/writes with
  Supabase calls and add a login screen. Suggested tables: `clients` (with `services`/`notes` as
  JSONB) and `jobs`; enable row-level security so each account sees only its own data.
- Set `VITE_GOOGLE_MAPS_API_KEY` (and later Supabase keys) as Vercel env vars.

## Suggested next steps

1. Real persistence + auth (Supabase + Vercel — see above).
2. Two-way Google Calendar sync via OAuth (needs the backend from step 1).
3. "Mark job complete / paid" status so actuals reflect collected revenue vs. just scheduled.
4. Invoicing / QuickBooks export from completed jobs.
5. Route optimization on the map for a day's jobs.
