# Deploying Limb CRM (Supabase + Railway)

The app is ready to run in **cloud mode**: real login + a Postgres database, so your data
persists and syncs across devices. Below is the one-time setup.

Local dev keeps working without any of this — with no Supabase env vars set, the app runs
in local/demo mode (browser storage, no login).

---

## 1. Set up Supabase (database + login)

1. Create a free project at **https://supabase.com** (pick a region near you; save the DB password).
2. In the project: **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and **Run**.
   This creates the `clients` and `jobs` tables with row-level security (each account only sees its own data).
3. **Project Settings → API** and copy two values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public** key → `VITE_SUPABASE_ANON_KEY`
4. **Authentication → Providers → Email** is on by default (magic-link sign-in). Nothing else needed.
   - Optional: under **Authentication → URL Configuration**, add your Railway URL (from step 3) to
     "Redirect URLs" once you have it, so the email link returns to the live site.

## 2. Push the code to GitHub

From the `limb-crm` folder (a git repo is already initialized with an initial commit):

```bash
# create an empty repo on github.com first, then:
git remote add origin https://github.com/<you>/limb-crm.git
git branch -M main
git push -u origin main
```

`.env` is gitignored, so your API keys are never committed.

## 3. Deploy on Railway

1. **railway.com → New Project → Deploy from GitHub repo** → pick `limb-crm`.
2. Railway auto-detects Node. It runs `npm run build` then `npm start`
   (`vite preview` serving the built app on Railway's `$PORT`).
3. **Variables** tab — add these (same values as your `.env`):
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   > Vite inlines these at **build** time, so they must be set before/at deploy. Redeploy after adding.
4. **Settings → Networking → Generate Domain** to get your public URL.
5. Add that URL to:
   - Supabase **Redirect URLs** (step 1.4), and
   - your Google Maps API key's **HTTP referrer** restrictions.

## Done

Visit the Railway URL → sign in with your email → start entering real clients. Everything saves
to Supabase. To invite a teammate later, they just sign in with their own email (they'll see their
own data — multi-user sharing of the *same* business would be a follow-up).

---

### Notes
- **Migrating your local demo data** isn't automatic — cloud mode starts empty (that's intended, so
  you begin with real data). If you want your local entries copied up, say the word.
- **Two-way Google Calendar sync** is the next backend feature; it needs a server-side OAuth flow,
  which we can add on Railway as a small function.
