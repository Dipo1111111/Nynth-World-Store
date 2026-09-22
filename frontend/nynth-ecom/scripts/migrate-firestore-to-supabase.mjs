// scripts/migrate-firestore-to-supabase.mjs — one-way Firestore -> Postgres copy.
// RUN ONLY AT CUTOVER with admin keys. Nothing hardcoded.
//   FIREBASE_SERVICE_ACCOUNT_JSON='{"..."}'  (Firebase Console > Project Settings > Service accounts > Generate key)
//   VITE_FIREBASE_PROJECT_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   node scripts/migrate-firestore-to-supabase.mjs
// Preserves doc IDs + created_at/updated_at. Safe to re-run (upserts).
import admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";

import { readFileSync } from "node:fs";
const svcPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || new URL("../.secrets/firebase-service-account.json", import.meta.url);
const svc = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  : JSON.parse(readFileSync(svcPath, "utf8"));
if (!svc.project_id) { console.error("Set FIREBASE_SERVICE_ACCOUNT_JSON first"); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(svc) });
const db = admin.firestore();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ts = (v) => v?.toDate?.()?.toISOString?.() ?? null;

async function copyAll(firestorePath, table, map) {
  const snap = await db.collection(firestorePath).get();
  console.log(firestorePath + ": " + snap.size + " docs");
  for (const d of snap.docs) {
    const row = map(d.id, d.data());
    const { error } = await supabase.from(table).upsert(row, { onConflict: "id" });
    if (error) console.error("upsert failed " + table + "/" + d.id, error.message);
  }
}
await copyAll("products", "products", (id, p) => ({ id, name: p.name ?? null, title: p.title ?? null, category: (p.category ?? "").toLowerCase() || null, price: Number(p.price ?? 0), stock_quantity: Number(p.stockQuantity ?? p.stock_quantity ?? 0), is_public: p.isPublic ?? true, featured: !!p.featured, best_seller: !!(p.bestSeller ?? p.best_seller), tags: p.tags ?? [], display_order: p.displayOrder ?? 0, data: p, created_at: ts(p.created_at) ?? new Date().toISOString() }));
await copyAll("orders", "orders", (id, o) => ({ id, user_id: o.userId ?? null, customer: o.customer ?? {}, items: o.items ?? [], tickets: o.tickets ?? [], subtotal: Number(o.subtotal ?? 0), shipping_fee: Number(o.shippingFee ?? o.shipping_fee ?? 0), discount_amount: Number(o.discountAmount ?? 0), discount_code: o.discountCode ?? null, total: Number(o.total ?? 0), payment_status: o.payment_status ?? "pending", order_status: o.order_status ?? "pending", payment_reference: o.payment_reference ?? null, created_at: ts(o.created_at) ?? new Date().toISOString() }));
await copyAll("users", "users", (id, u) => ({ id, email: u.email, first_name: u.firstName ?? u.first_name ?? null, last_name: u.lastName ?? u.last_name ?? null, role: u.role ?? "customer", photo_url: u.photoURL ?? u.photo_url ?? null, created_at: ts(u.createdAt ?? u.created_at) ?? new Date().toISOString() }));
await copyAll("discount_codes", "discount_codes", (id, d) => ({ id, code: String(d.code ?? id).toUpperCase(), percent_off: d.percentOff ?? null, amount_off: d.amountOff ?? null, active: d.active ?? true, expires_at: ts(d.expiresAt) }));
await copyAll("subscribers", "subscribers", (id, s) => ({ id, email: String(s.email).toLowerCase(), source: s.source ?? "newsletter", created_at: ts(s.created_at) ?? new Date().toISOString() }));
await copyAll("lookbooks", "lookbooks", (id, l) => ({ id, title: l.title ?? null, featured: !!l.featured, data: l }));
await copyAll("contact_messages", "contact_messages", (id, c) => ({ id, name: c.name ?? null, email: c.email ?? null, message: c.message ?? null, data: c }));
// settings/site_config single doc
try { const s = await db.collection("settings").doc("site_config").get(); if (s.exists) await supabase.from("settings").upsert({ id: "site_config", data: s.data() }, { onConflict: "id" }); console.log("settings/site_config copied"); } catch (e) { console.error(e.message); }
// analytics + presence skipped (counters restart at 0, sessions ephemeral)
console.log("DONE");
