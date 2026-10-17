import React, { useState, useEffect, useMemo, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  fetchStaffRoles,
  addStaffRole,
  updateStaffRole,
  suspendStaffRole,
  restoreStaffRole,
  deleteStaffRole,
  fetchProducts,
  fetchEventFinance,
  assignEventOrganizer,
} from "../../api/firebaseFunctions";
import { useAuth } from "../../context/AuthContext";
import { PERMISSION_GROUPS, ROLES, roleMeta, effectivePermissions } from "../../utils/permissions";
import { formatEventDate } from "../../utils/tickets";
import { Loader2, Plus, X, Users, ShieldCheck, Trash2, Edit2, UserX, UserCheck, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

const blankForm = () => ({
  email: "",
  fullName: "",
  department: "",
  role: "vice_admin",
  eventIds: [],
  overrides: {},
  notes: "",
});

const STATUS_CHIP = {
  invited: "bg-amber-500/[0.14] text-amber-300 border-amber-500/25",
  active: "bg-emerald-500/[0.14] text-emerald-300 border-emerald-500/25",
  suspended: "bg-slate-500/[0.18] text-slate-300 border-slate-500/30",
};

const STATUS_LABEL = { invited: "Invited", active: "Active", suspended: "Suspended" };

// Anything with a ticketing role can be made the director of a ticket section.
const canDirect = (role) => role === "ticket_organizer" || role === "ticket_admin";

// One person, one row: who they are, what they can do, which events they see.
export default function StaffAccess() {
  const { currentUser } = useAuth();
  const [staff, setStaff] = useState([]);
  const [events, setEvents] = useState([]);
  const [finance, setFinance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [people, products, money] = await Promise.all([
        fetchStaffRoles(),
        fetchProducts(),
        fetchEventFinance(),
      ]);
      setStaff(people);
      setEvents(products.filter((p) => p.category === "tickets"));
      setFinance(money);
    } catch (e) {
      toast.error(e.message || "Could not load staff");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const eventById = useMemo(
    () => Object.fromEntries(events.map((e) => [e.id, e])),
    [events]
  );
  const financeByEvent = useMemo(
    () => Object.fromEntries(finance.map((f) => [f.event_id, f])),
    [finance]
  );
  const personById = useMemo(
    () => Object.fromEntries(staff.map((s) => [s.id, s])),
    [staff]
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(blankForm());
  };

  const openEdit = (person) => {
    setEditingId(person.id);
    setForm({
      email: person.email ?? "",
      fullName: person.fullName ?? "",
      department: person.department ?? "",
      role: person.role,
      eventIds: person.eventIds ?? [],
      overrides: person.permissions ?? {},
      notes: person.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(blankForm());
  };

  const roleDefaults = roleMeta(form.role)?.defaults ?? [];

  // The toggle shows what the person would get right now. The stored override
  // is only the difference from the role default, which keeps a later change to
  // a role's defaults from being silently frozen by an old override.
  const effective = effectivePermissions(form.role, form.overrides);
  const togglePermission = (key) => {
    const on = effective[key] === true;
    const isDefault = roleDefaults.includes(key) === on;
    setForm((f) => {
      const overrides = { ...f.overrides };
      if (isDefault) delete overrides[key];
      else overrides[key] = on;
      return { ...f, overrides };
    });
  };

  const changeRole = (role) => {
    const nextRole = role;
    const nextDefaults = roleMeta(nextRole)?.defaults ?? [];
    // Drop overrides that now match the new default; keep the deliberate ones.
    const overrides = {};
    for (const [key, value] of Object.entries(form.overrides)) {
      if (value === nextDefaults.includes(key)) continue;
      overrides[key] = value;
    }
    setForm((f) => ({ ...f, role: nextRole, overrides, eventIds: canDirect(nextRole) ? f.eventIds : [] }));
  };

  const toggleEvent = (eventId) => {
    setForm((f) => ({
      ...f,
      eventIds: f.eventIds.includes(eventId)
        ? f.eventIds.filter((id) => id !== eventId)
        : [...f.eventIds, eventId],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) {
      toast.error("Enter an email address");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        email: form.email,
        fullName: form.fullName,
        department: form.department,
        role: form.role,
        permissions: form.overrides,
        eventIds: canDirect(form.role) ? form.eventIds : [],
        notes: form.notes,
        invitedBy: currentUser?.email ?? null,
      };
      if (editingId) {
        await updateStaffRole(editingId, payload);
        toast.success("Access updated");
      } else {
        const result = await addStaffRole(payload);
        if (!result.success) {
          toast.error(result.error || "Could not add that person");
          setSaving(false);
          return;
        }
        toast.success("Added. They get access the moment they log in with that email.");
      }
      closeForm();
      await load();
    } catch (err) {
      toast.error(err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (person, next, message) => {
    try {
      if (next === "suspended") await suspendStaffRole(person.id);
      else await restoreStaffRole(person.id);
      toast.success(message);
      await load();
    } catch (e) {
      toast.error(e.message || "Could not change access");
    }
  };

  const remove = async (person) => {
    if (!window.confirm(`Remove ${person.email} completely? Their access ends immediately.`)) return;
    try {
      await deleteStaffRole(person.id);
      toast.success("Access removed");
      await load();
    } catch (e) {
      toast.error(e.message || "Could not remove");
    }
  };

  const appoint = async (eventId, staffId, rate) => {
    try {
      await assignEventOrganizer(eventId, staffId || null, rate);
      toast.success("Director appointed");
      await load();
    } catch (e) {
      toast.error(e.message || "Could not appoint");
    }
  };

  const directors = staff.filter((s) => canDirect(s.role));

  return (
    <AdminLayout title="Staff & Access">
      <div className="max-w-5xl">
        <p className="text-sm text-[#EDEAE2]/55 mb-8">
          One platform, several levels of access. Add somebody by email, give them a role, then turn
          individual permissions on or off. Everything below is enforced in the database, so a direct
          URL or an API call gives them exactly what you see here and nothing more.
        </p>

        {/* ADD / EDIT */}
        <form onSubmit={submit} className="bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-card p-6 mb-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#EDEAE2]">
              {editingId ? `Editing ${form.email || "person"}` : "Add new person"}
            </h2>
            {editingId && (
              <button type="button" onClick={closeForm} className="focus-ring p-2 hover:bg-white/[0.09] rounded-lg">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 mb-2">
                Full name
              </label>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. Ada Nwosu"
                className="w-full px-4 py-3 border border-white/14 rounded-lg text-sm focus-ring"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 mb-2">
                Email address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="they@example.com"
                required
                className="w-full px-4 py-3 border border-white/14 rounded-lg text-sm focus-ring"
              />
              <p className="text-[10px] text-[#EDEAE2]/42 mt-2 leading-relaxed">
                They log in with this email and the access turns itself on.
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 mb-2">
                Department
              </label>
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. Operations"
                className="w-full px-4 py-3 border border-white/14 rounded-lg text-sm focus-ring"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 mb-2">
                Assigned role
              </label>
              <select
                value={form.role}
                onChange={(e) => changeRole(e.target.value)}
                className="w-full px-4 py-3 border border-white/14 rounded-lg text-sm focus-ring bg-[#0a0a0a] cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#EDEAE2]/42 mt-2 leading-relaxed">
                {roleMeta(form.role)?.blurb}
              </p>
            </div>
          </div>

          {/* EVENT SCOPING */}
          {canDirect(form.role) && (
            <div className="mb-6 pt-6 border-t border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 mb-1">
                Events they may manage
              </p>
              <p className="text-[10px] text-[#EDEAE2]/42 mb-4 leading-relaxed">
                Scoped at the database level. Swapping an event id in the URL gets them nothing.
              </p>
              {events.length === 0 ? (
                <p className="text-sm text-[#EDEAE2]/50">No events created yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {events.map((ev) => {
                    const on = form.eventIds.includes(ev.id);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => toggleEvent(ev.id)}
                        aria-pressed={on}
                        className={`focus-ring text-left px-4 py-3 rounded-lg border transition-colors ${
                          on
                            ? "bg-[#EDEAE2] text-[#0d0d0f] border-[#EDEAE2]"
                            : "bg-white/[0.04] text-[#EDEAE2]/70 border-white/10 hover:bg-white/[0.07]"
                        }`}
                      >
                        <p className="text-[12px] font-bold uppercase tracking-wide truncate">
                          {ev.title || ev.name || "Untitled event"}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${on ? "text-[#0d0d0f]/60" : "text-[#EDEAE2]/45"}`}>
                          {ev.eventDateTime ? formatEventDate(ev.eventDateTime) : "DATE TBC"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PERMISSION TOGGLES */}
          <div className="pt-6 border-t border-white/10">
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42">
                Specific permissions
              </p>
              <p className="text-[10px] text-[#EDEAE2]/42">
                    {roleMeta(form.role)?.label} defaults, then your changes
                  </p>
            </div>
            <div className="space-y-6">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.key}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EDEAE2] mb-1">
                    {group.label}
                  </p>
                  <p className="text-[10px] text-[#EDEAE2]/42 mb-3">{group.blurb}</p>
                  <div className="grid md:grid-cols-2 gap-2">
                    {group.permissions.map((p) => {
                      const on = effective[p.key] === true;
                      const isDefault = roleDefaults.includes(p.key);
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => togglePermission(p.key)}
                          aria-pressed={on}
                          className={`focus-ring flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                            on
                              ? "bg-emerald-500/[0.08] border-emerald-500/25"
                              : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              on ? "bg-emerald-400 border-emerald-400" : "border-white/25"
                            }`}
                          >
                            {on && <span className="w-1.5 h-1.5 rounded-full bg-[#0c0c0c]" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[12px] text-[#EDEAE2]/85 leading-snug">
                              {p.label}
                            </span>
                            {!isDefault && (
                              <span className="block text-[9px] font-bold uppercase tracking-widest text-amber-300/80 mt-1">
                                your change
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
            {editingId && (
              <button
                type="button"
                onClick={closeForm}
                className="focus-ring flex-1 py-3 text-sm font-bold border border-white/18 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="focus-ring flex-1 py-3 text-sm font-bold bg-[#EDEAE2] text-[#0d0d0f] rounded-lg hover:bg-[#DBD8CE] shadow-card transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editingId ? "Save access" : "Add person"}
            </button>
          </div>
        </form>

        {/* PEOPLE */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-white/25" size={28} />
          </div>
        ) : staff.length === 0 ? (
          <div className="border border-dashed border-white/15 rounded-2xl p-12 text-center">
            <Users size={28} className="mx-auto mb-3 text-[#EDEAE2]/25" />
            <p className="text-sm text-[#EDEAE2]/65 mb-6">
              Nobody yet. Add your first Vice Admin or Ticket Organizer above.
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="focus-ring inline-flex items-center gap-2 bg-[#EDEAE2] text-[#0d0d0f] px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#DBD8CE] transition-all"
            >
              <Plus size={14} /> Add person
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-12">
            {staff.map((person) => {
              const granted = Object.values(
                effectivePermissions(person.role, person.permissions)
              ).filter(Boolean).length;
              return (
                <div key={person.id} className="bg-[#0a0a0a] rounded-xl border border-white/10 shadow-card p-5">
                  <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <p className="text-sm font-bold text-[#EDEAE2]">
                          {person.fullName || person.email}
                        </p>
                        <span
                          className={`text-[8px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider border ${STATUS_CHIP[person.status]}`}
                        >
                          {STATUS_LABEL[person.status]}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#EDEAE2]/50 truncate">{person.email}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-3">
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/[0.07] text-[#EDEAE2]/70 border border-white/10">
                          {roleMeta(person.role)?.label ?? person.role}
                        </span>
                        {person.department && (
                          <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/[0.07] text-[#EDEAE2]/55 border border-white/10">
                            {person.department}
                          </span>
                        )}
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/[0.07] text-[#EDEAE2]/55 border border-white/10">
                          {granted} permission{granted === 1 ? "" : "s"}
                        </span>
                      </div>
                      {person.eventIds?.length > 0 && (
                        <p className="text-[10px] text-[#EDEAE2]/45 mt-3 leading-relaxed">
                          Scoped to{" "}
                          {person.eventIds
                            .map((id) => eventById[id]?.title || eventById[id]?.name || id)
                            .join(", ")}
                        </p>
                      )}
                      {person.eventIds?.length === 0 && canDirect(person.role) && (
                        <p className="text-[10px] text-amber-300/70 mt-3">
                          No events assigned yet, so they can see no tickets.
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(person)}
                        className="focus-ring inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-white/15 text-[9px] font-bold uppercase tracking-widest text-[#EDEAE2]/75 hover:text-[#EDEAE2] transition-colors"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      {person.status === "suspended" ? (
                        <button
                          type="button"
                          onClick={() => setStatus(person, "active", `${person.email} has access again`)}
                          className="focus-ring inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-300 text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-500/[0.14] transition-colors"
                        >
                          <UserCheck size={12} /> Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setStatus(person, "suspended", `${person.email} can no longer sign in to admin`)}
                          className="focus-ring inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-white/15 text-[9px] font-bold uppercase tracking-widest text-[#EDEAE2]/75 hover:text-[#EDEAE2] transition-colors"
                        >
                          <UserX size={12} /> Revoke
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => remove(person)}
                        aria-label={`Remove ${person.email}`}
                        className="focus-ring p-2.5 rounded-lg border border-rose-500/25 bg-rose-500/[0.08] text-rose-300 hover:bg-rose-500/[0.14] transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TICKET SECTION DIRECTORS */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={16} className="text-[#EDEAE2]/60" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#EDEAE2]">
              Ticket section directors
            </h2>
          </div>
          <p className="text-sm text-[#EDEAE2]/55 mb-6 max-w-2xl">
            Choose who administers each ticket section. The director sees the ticket admin tools for
            their event only. You keep seeing all of it under Ticket Platform.
          </p>

          {events.length === 0 ? (
            <p className="text-sm text-[#EDEAE2]/50">No events yet.</p>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => {
                const directorId = ev.organizerStaffId ?? null;
                const rate = Number(ev.commissionRate ?? 0);
                const money = financeByEvent[ev.id];
                return (
                  <div key={ev.id} className="bg-[#0a0a0a] rounded-xl border border-white/10 shadow-card p-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#EDEAE2] uppercase truncate">
                          {ev.title || ev.name || "Untitled event"}
                        </p>
                        <p className="text-[11px] text-[#EDEAE2]/50 mt-1">
                          {ev.eventDateTime ? formatEventDate(ev.eventDateTime) : "DATE TBC"}
                          {money ? ` · ₦${Number(money.gross_collected).toLocaleString()} collected` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={directorId ?? ""}
                          onChange={(e) => appoint(ev.id, e.target.value || null, rate)}
                          className="focus-ring px-4 py-2.5 border border-white/14 rounded-lg text-[11px] bg-[#0a0a0a] cursor-pointer"
                          aria-label={`Director for ${ev.title || ev.name}`}
                        >
                          <option value="">No director, NYNTH runs it</option>
                          {directors.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.fullName || d.email} ({roleMeta(d.role)?.label})
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[#EDEAE2]/42">
                            Commission
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            defaultValue={rate}
                            onBlur={(e) => appoint(ev.id, directorId, e.target.value)}
                            className="focus-ring w-20 px-3 py-2.5 border border-white/14 rounded-lg text-[11px] tabular-nums"
                            aria-label={`NYNTH commission percent for ${ev.title || ev.name}`}
                          />
                          <span className="text-[11px] text-[#EDEAE2]/50">%</span>
                        </label>
                      </div>
                    </div>
                    {directorId && personById[directorId] && (
                      <p className="text-[10px] text-[#EDEAE2]/42 mt-3">
                        {personById[directorId].fullName || personById[directorId].email} administers this
                        section. They cannot see the clothing store, any other organizer, or NYNTH
                        company finances.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {directors.length === 0 && events.length > 0 && (
            <p className="text-[10px] text-[#EDEAE2]/42 mt-6 leading-relaxed flex items-start gap-2">
              <KeyRound size={12} className="shrink-0 mt-0.5" />
              No Ticket Organizer or Ticketing Admin exists yet. Add one above and they become
              appointable as a director.
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
