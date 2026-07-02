import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

// When both are set, the app runs in "cloud" mode: real login + Postgres persistence.
// When missing, it falls back to local (browser-only) mode so dev/demo still works.
export const isCloud = !!(URL && ANON)

export const supabase = isCloud ? createClient(URL, ANON) : null
