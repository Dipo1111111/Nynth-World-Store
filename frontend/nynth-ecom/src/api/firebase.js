// Canonical singleton path kept for zero-churn cutover.
// Supabase-backed; alias exports preserve the { auth, db, storage, functions }
// names that existing consumers import so nothing downstream changes.
import { supabase } from "./supabase";

export { supabase };
export const auth = supabase.auth;
export const db = supabase;
export const storage = supabase.storage;
export const functions = supabase.functions;
