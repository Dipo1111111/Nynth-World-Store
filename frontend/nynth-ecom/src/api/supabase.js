// src/api/supabase.js — Supabase client (LOCAL, not wired yet)
// Fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env when admin provides them.
// This file intentionally does NOT import firebase.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.warn("[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — Supabase calls will fail until .env is filled.");
}

export const supabase = createClient(url ?? "https://placeholder.supabase.co", anon ?? "placeholder-anon-key");
