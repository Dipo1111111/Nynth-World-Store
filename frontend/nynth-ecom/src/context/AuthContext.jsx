// AuthContext.supabase.jsx - Supabase version. Same API as AuthContext.jsx (Firebase).
// Swap: rename this file to AuthContext.jsx at cutover, or re-point imports.
// Admin = VITE_ADMIN_EMAILS whitelist written to public.users.role on signup.
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../api/supabase";

const AuthContext = createContext();
export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

   async function ensureProfile(user) {
     const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
     const isAdmin = adminEmails.includes(String(user.email).toLowerCase());
     const role = isAdmin ? "admin" : "customer";
     const { data } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
     if (!data) {
       await supabase.from("users").insert({ id: user.id, email: user.email, first_name: user.user_metadata?.firstName ?? null, last_name: user.user_metadata?.lastName ?? null, role, photo_url: user.user_metadata?.avatar_url ?? null });
     } else if (isAdmin && data.role !== "admin") {
       await supabase.from("users").update({ role: "admin" }).eq("id", user.id);
     } else if (!isAdmin && data.role !== "customer" && data.role !== "admin") {
       await supabase.from("users").update({ role }).eq("id", user.id);
     }
     return role;
   }

  async function signup(email, password, firstName, lastName) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { firstName, lastName, displayName: firstName + " " + lastName } } });
    if (error) throw error;
    if (data.user) await ensureProfile(data.user);
    return data.user;
  }
  function login(email, password) { return supabase.auth.signInWithPassword({ email, password }); }
  function logout() { return supabase.auth.signOut(); }
  function resetPassword(email) { return supabase.auth.resetPasswordForEmail(email); }
  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) throw error;
    return { OAuthRedirect: true };
  }

  async function checkAdmin(id) {
    try {
      setIsAdminLoading(true);
      const { data } = await supabase.from("users").select("role").eq("id", id).maybeSingle();
      setIsAdmin(data?.role === "admin");
    } catch { setIsAdmin(false); } finally { setIsAdminLoading(false); }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user ?? null;
      setCurrentUser(user);
      if (user) { await ensureProfile(user); await checkAdmin(user.id); }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) { await ensureProfile(user); await checkAdmin(user.id); }
      else { setIsAdmin(false); setIsAdminLoading(false); }
      setLoading(false);
    });
    const t = setTimeout(() => setLoading((p) => (p ? false : p)), 5000);
    return () => { clearTimeout(t); sub.subscription.unsubscribe(); };
  }, []);

  return <AuthContext.Provider value={{ currentUser, isAdmin, isAdminLoading, signup, login, logout, resetPassword, loginWithGoogle }}>{!loading && children}</AuthContext.Provider>;
}
