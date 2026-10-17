// AuthContext.jsx - Supabase auth plus the permission layer.
//
// users.role = 'admin' is the founder and stays exactly as it was. Every other
// level of access lives in staff_roles and arrives through the my_access() RPC.
// The founder is not a staff row: is_admin() short circuits every permission
// check in Postgres, and can() does the same here.
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../api/supabase";
import { claimStaffInvitation, fetchMyAccess } from "../api/supabaseFunctions";
import { effectivePermissions } from "../utils/permissions";

const AuthContext = createContext();
export function useAuth() { return useContext(AuthContext); }

const EMPTY_ACCESS = { is_admin: false, role: null, permissions: {}, event_ids: [] };

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [access, setAccess] = useState(EMPTY_ACCESS);
  const [accessLoading, setAccessLoading] = useState(false);

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

  // Claim any invitation addressed to this email, then read back what it grants.
  // Safe to run on every load: a suspended or unknown email gets nothing.
  const loadAccess = useCallback(async () => {
    setAccessLoading(true);
    try {
      await claimStaffInvitation();
      const next = await fetchMyAccess();
      setAccess({ ...EMPTY_ACCESS, ...next });
    } catch {
      setAccess(EMPTY_ACCESS);
    } finally {
      setAccessLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user ?? null;
      setCurrentUser(user);
      if (user) { await ensureProfile(user); await checkAdmin(user.id); await loadAccess(); }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) { await ensureProfile(user); await checkAdmin(user.id); await loadAccess(); }
      else { setIsAdmin(false); setIsAdminLoading(false); setAccess(EMPTY_ACCESS); }
      setLoading(false);
    });
    const t = setTimeout(() => setLoading((p) => (p ? false : p)), 5000);
    return () => { clearTimeout(t); sub.subscription.unsubscribe(); };
  }, [loadAccess]);

  // The founder holds every permission. A staff member holds their role
  // defaults with their own overrides laid on top, which is exactly how
  // my_permissions() composes them in Postgres.
  const permissions = isAdmin
    ? null // null means "no restriction"
    : effectivePermissions(access?.role, access?.permissions);

  const can = useCallback(
    (key) => {
      if (!currentUser) return false;
      if (isAdmin) return true;
      if (!key) return true;
      return permissions?.[key] === true;
    },
    [currentUser, isAdmin, permissions]
  );

  // Anyone the platform has given a job: the founder, or a person with at
  // least one permission. Customers stay out of /admin entirely.
  const isStaff = Boolean(isAdmin) || Object.values(permissions ?? {}).some(Boolean);
  const canAccessEvents = (eventId) =>
    isAdmin || (Array.isArray(access?.event_ids) && access.event_ids.includes(eventId));

  // Product edits are split by line of business: the clothing catalogue needs
  // store.products.manage, a ticket organizer needs ticketing.events.edit on an
  // event that is assigned to them. Mirrors products_admin_write in Postgres.
  const canManageProduct = (product) => {
    if (isAdmin) return true;
    const isTicket = product?.category === "tickets";
    if (isTicket) return can("ticketing.events.edit") && canAccessEvents(product.id);
    return can("store.products.manage");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isAdminLoading,
        access,
        accessLoading,
        permissions,
        can,
        isStaff,
        canAccessEvents,
        canManageProduct,
        refreshAccess: loadAccess,
        signup,
        login,
        logout,
        resetPassword,
        loginWithGoogle,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}
