// src/api/supabaseFunctions.js - drop-in replacement for firebaseFunctions.js
// Same export names + signatures, backed by Supabase. Cloudinary stays as-is.
// Products: id (text, preserved Firestore ID), name/title, category, price,
//   stock_quantity, is_public, featured, best_seller, tags[], display_order, data{...}
// Orders: id, user_id (null=guest), customer{}, items[], tickets[], subtotal/shipping_fee/
//   discount_amount/discount_code/total, payment_status, order_status, payment_reference.

import { supabase } from "./supabase";
import { uploadImageToCloudinary, uploadMultipleImagesToCloudinary } from "./cloudinary";

const toTimestamp = (v) => {
  if (!v) return null;
  if (typeof v === 'object' && v.seconds) return v;
  const ms = v instanceof Date ? v.getTime() : new Date(v).getTime();
  return isNaN(ms) ? null : { seconds: Math.floor(ms / 1000) };
};
// Coerce to a finite number; NaN/undefined -> 0 so PostgREST never rejects with 400.
const finalNumber = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const rowToProduct = (r) => ({ ...(r.data ?? {}), id: r.id, stockQuantity: r.stock_quantity, inStock: r.stock_quantity > 0, isPublic: r.is_public, bestSeller: r.best_seller, displayOrder: r.display_order, name: r.name ?? r.data?.name, title: r.title ?? r.data?.title, category: r.category ?? r.data?.category, price: Number(r.price ?? r.data?.price ?? 0), featured: r.featured, tags: r.tags ?? [], created_at: toTimestamp(r.created_at) });
const rowToOrder = (r) => ({ id: r.id, userId: r.user_id, customer: r.customer ?? {}, items: r.items ?? [], tickets: r.tickets ?? [], subtotal: Number(r.subtotal ?? 0), shippingFee: Number(r.shipping_fee ?? 0), shipping_fee: Number(r.shipping_fee ?? 0), discountAmount: Number(r.discount_amount ?? 0), discountCode: r.discount_code, total: Number(r.total ?? 0), payment_status: r.payment_status, order_status: r.order_status, payment_reference: r.payment_reference, paid_at: r.paid_at, isTest: r.is_test === true, created_at: toTimestamp(r.created_at) });

// Storefront rule: hidden products never list. Exact-zero stock (deliberately
// sold out) never lists either. Null stock means unknown, stays visible.
const isLiveProduct = (p) => p.isPublic !== false && p.stockQuantity !== 0;

// Test-mode detection: the storefront runs on Paystack test keys until launch, so
// an order created under those keys is test traffic. Server (edge) re-stamps this
// authoritatively from its own secret key when it finalizes the payment.
const PAYSTACK_IS_TEST = (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "").startsWith("pk_test_");

// --- PRODUCTS CRUD ---
export const addProduct = async (product) => {
  const stock = Number(product.stockQuantity ?? product.stock_quantity ?? 0) || 0;
  const { data, error } = await supabase.from("products").insert({ name: product.name ?? null, title: product.title ?? null, category: (product.category ?? "").toLowerCase() || null, price: Number(product.price ?? 0) || 0, stock_quantity: stock, is_public: product.isPublic ?? true, featured: product.featured ?? false, best_seller: product.bestSeller ?? false, tags: product.tags ?? [], display_order: product.displayOrder ?? 0, data: { ...product } }).select("id").single();
  if (error) throw error;
  return data.id;
};
export const fetchProducts = async ({ admin = false } = {}) => {
  const { data, error } = await supabase.from("products").select("*").order("display_order", { ascending: true });
  if (error) { console.error("Error fetching products:", error); return []; }
  const all = (data ?? []).map(rowToProduct);
  return admin ? all : all.filter(isLiveProduct);
};
export const fetchSingleProduct = async (id, { admin = false } = {}) => {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const p = rowToProduct(data);
  return admin ? p : (p.isPublic !== false ? p : null);
};
 const PRODUCT_COLUMN_KEYS = new Set(["id", "name", "title", "category", "price", "stockQuantity", "stock_quantity", "inStock", "isPublic", "is_public", "featured", "bestSeller", "best_seller", "tags", "displayOrder", "display_order", "data", "created_at", "updated_at"]);
const mergeProductData = async (id, updates) => {
  const flexible = {};
  for (const [k, v] of Object.entries(updates)) {
    if (!PRODUCT_COLUMN_KEYS.has(k) && v !== undefined) flexible[k] = v;
  }
  if (Object.keys(flexible).length === 0) return null;
  const { data: existing } = await supabase.from("products").select("data").eq("id", id).maybeSingle();
  return { ...(existing?.data ?? {}), ...flexible };
};
 export const updateProduct = async (id, updates) => {
    const patch = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.category !== undefined) patch.category = updates.category;
    if (updates.price !== undefined) patch.price = Number(updates.price) || 0;
    if (updates.stockQuantity !== undefined) patch.stock_quantity = Number(updates.stockQuantity) || 0;
    if (updates.isPublic !== undefined) patch.is_public = updates.isPublic;
    if (updates.featured !== undefined) patch.featured = updates.featured;
    if (updates.bestSeller !== undefined) patch.best_seller = updates.bestSeller;
    if (updates.tags !== undefined) patch.tags = updates.tags;
    if (updates.displayOrder !== undefined) patch.display_order = updates.displayOrder;
    const dataPatch = await mergeProductData(id, updates);
    if (dataPatch) patch.data = dataPatch;
    const { data, error } = await supabase.from("products").update(patch).eq("id", id).select("id");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Update failed - no rows affected. Check that you are an admin and authenticated.");
    return true;
  };
 export const deleteProduct = async (id) => {
    const { data, error } = await supabase.from("products").delete().eq("id", id).select("id");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Delete failed - no rows affected. Check that you are an admin and authenticated.");
    return true;
  };
export const markTicketUsed = async (orderId, code) => {
  const normalized = String(code ?? "").trim().toUpperCase();
  if (!normalized) throw new Error("Enter a ticket code.");
  const { data: order, error: fetchError } = await supabase.from("orders").select("tickets").eq("id", orderId).maybeSingle();
  if (fetchError) throw fetchError;
  if (!order) throw new Error("Order not found.");
  const tickets = Array.isArray(order.tickets) ? order.tickets : [];
  const idx = tickets.findIndex((t) => String(t.code ?? "").toUpperCase() === normalized);
  if (idx === -1) throw new Error("Ticket code not found on this order.");
  if (tickets[idx].used) throw new Error("Ticket already used.");
  const next = tickets.map((t, i) => (i === idx ? { ...t, used: true, used_at: new Date().toISOString() } : t));
  const { error } = await supabase.from("orders").update({ tickets: next }).eq("id", orderId);
  if (error) throw error;
  return next[idx];
};
 export const updateProductOrderBatch = async (productsArray) => {
    const results = await Promise.all(productsArray.map((p, i) => supabase.from("products").update({ display_order: i }).eq("id", p.id).select("id")));
    const failed = results.filter((r) => !r.error && (!r.data || r.data.length === 0));
    if (failed.length > 0) throw new Error("Batch update failed - some rows affected by RLS. Check admin permissions.");
    return true;
  };

// --- FILTERING ---
export const fetchFeaturedProducts = async (max = 6) => {
  const { data } = await supabase.from("products").select("*").eq("featured", true).limit(max);
  let list = (data ?? []).map(rowToProduct).filter(isLiveProduct);
  if (list.length < max) {
    const { data: bs } = await supabase.from("products").select("*").eq("best_seller", true).limit(max - list.length);
    list = [...list, ...((bs ?? []).map(rowToProduct).filter(isLiveProduct))];
  }
  if (list.length < 3) {
    const { data: latest } = await supabase.from("products").select("*").order("created_at", { ascending: false }).limit(max);
    return (latest ?? []).map(rowToProduct).filter(isLiveProduct);
  }
  return list;
};
export const fetchProductsByCategory = async (category, max = 15) => {
  const { data } = await supabase.from("products").select("*").eq("category", String(category).toLowerCase()).limit(max);
  return (data ?? []).map(rowToProduct).filter(isLiveProduct);
};
export const fetchProductsByTag = async (tag, max = 10) => {
  const { data } = await supabase.from("products").select("*").contains("tags", [tag]).limit(max);
  return (data ?? []).map(rowToProduct).filter(isLiveProduct);
};
export const fetchRelatedProducts = async (category, excludeId, max = 4) => {
  const { data } = await supabase.from("products").select("*").eq("category", category).limit(max + 1);
  return (data ?? []).map(rowToProduct).filter((p) => p.id !== excludeId && isLiveProduct(p)).slice(0, max);
};
export const fetchNewArrivals = async (max = 8) => {
  const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }).limit(max);
  return (data ?? []).map(rowToProduct).filter(isLiveProduct);
};
export const fetchRecommendedProducts = async (product, max = 4) => fetchRelatedProducts(product?.category, product?.id, max);
export const searchProducts = async (term) => {
  const { data } = await supabase.from("products").select("*").ilike("name", "%" + term + "%").limit(20);
  return (data ?? []).map(rowToProduct).filter(isLiveProduct);
};
export const getCategories = async () => {
  const { data } = await supabase.from("products").select("category");
  return [...new Set((data ?? []).map((r) => r.category).filter(Boolean))];
};
export const updateMultipleProducts = async (ids, updates) => updateProductOrderBatch(ids.map((id) => ({ id }))) && ids.length >= 0 ? Promise.all(ids.map((id) => updateProduct(id, updates))).then(() => true) : false;
export const deleteMultipleProducts = async (ids) => {
  const { error } = await supabase.from("products").delete().in("id", ids);
  return !error;
};
export const getProductStats = async () => {
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true });
  return { total: count ?? 0 };
};

// --- LOOKBOOKS ---
export const fetchLookbooks = async () => {
  const { data } = await supabase.from("lookbooks").select("*").order("created_at", { ascending: false });
  return (data ?? []).map((r) => ({ id: r.id, ...r.data, title: r.title, featured: r.featured }));
};
export const fetchFeaturedLookbooks = async () => {
  const { data } = await supabase.from("lookbooks").select("*").eq("featured", true);
  return (data ?? []).map((r) => ({ id: r.id, ...r.data, title: r.title }));
};
export const addLookbook = async ({ image }) => {
  const { data, error } = await supabase.from("lookbooks").insert({ id: crypto.randomUUID(), title: null, featured: false, data: { image } }).select("id").single();
  if (error) throw error;
  return data.id;
};
export const deleteLookbook = async (id) => {
  const { error } = await supabase.from("lookbooks").delete().eq("id", id);
  return !error;
};
export const subscribeLookbooks = (callback) => {
  const ch = supabase.channel("lookbooks-admin").on("postgres_changes", { event: "*", schema: "public", table: "lookbooks" }, () => fetchLookbooks().then(callback)).subscribe();
  return () => supabase.removeChannel(ch);
};

// --- UPDATE-DB cleanup (dev utility; mirrors Firestore wipeCollection) ---
export const wipeTable = async (tableName) => {
  const { data } = await supabase.from(tableName).select("*");
  if ((data ?? []).length === 0) return 0;
  const { error } = await supabase.from(tableName).delete().in("id", (data ?? []).map((r) => r.id));
  return error ? 0 : (data ?? []).length;
};
export const wipeAllTables = async (tables = ["orders", "users", "contact_messages", "newsletter_subscriptions"]) => {
  const results = {};
  for (const t of tables) results[t] = await wipeTable(t);
  return results;
};
export const seedOrders = async () => {
  const { data: products } = await supabase.from("products").select("*");
  if (!products || products.length === 0) throw new Error("No products found.");
  const SAMPLE_CHANNELS = ['Instagram', 'WhatsApp', 'Direct', 'Organic Search'];
  const SAMPLE_CITIES = ['Ikeja', 'Lekki', 'Victoria Island', 'Surulere', 'Ajah'];
  const SAMPLE_NAMES = [
    { first: 'Emeka', last: 'Okonkwo' }, { first: 'Zainab', last: 'Bello' },
    { first: 'Chidi', last: 'Eze' }, { first: 'Tunde', last: 'Bakare' },
    { first: 'Folake', last: 'Adeyemi' }
  ];
  const rows = [];
  for (let i = 0; i < 15; i++) {
    const p = products[Math.floor(Math.random() * products.length)];
    const qty = Math.floor(Math.random() * 2) + 1;
    const name = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
    const city = SAMPLE_CITIES[Math.floor(Math.random() * SAMPLE_CITIES.length)];
    const channel = SAMPLE_CHANNELS[Math.floor(Math.random() * SAMPLE_CHANNELS.length)];
    const date = new Date(); date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    const image = p.image || (p.data?.images && p.data.images[0]) || "";
    const title = p.title || p.name || "";
    const price = Number(p.price) || 25000;
    rows.push({ id: `NY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, user_id: null, customer: { firstName: name.first, lastName: name.last, email: `${name.first.toLowerCase()}@example.com`, phone: "08012345678", address: "123 Sample Street", city, state: "LAGOS" }, items: [{ id: p.id, title, price, quantity: qty, selectedSize: "M", selectedColor: "Black", image }], subtotal: price * qty, shipping_fee: 2500, discount_amount: 0, discount_code: null, total: price * qty + 2500, payment_status: Math.random() > 0.3 ? "paid" : "pending", order_status: Math.random() > 0.5 ? "delivered" : "processing", payment_method: "paystack", is_test: true, channel, created_at: date.toISOString(), updated_at: date.toISOString() });
  }
  const { error } = await supabase.from("orders").insert(rows);
  if (error) throw error;
};

// --- IMAGES (Cloudinary unchanged) ---
export const uploadImage = (file) => uploadImageToCloudinary(file);
export const uploadMultipleImages = (files) => uploadMultipleImagesToCloudinary(files);

// --- PAYMENTS (via Edge Functions; anon key, server verifies with Paystack secret) ---
export const initializePayment = async (paymentData) => {
  const { data, error } = await supabase.functions.invoke("initialize-payment", { body: paymentData });
  if (error) throw error;
  return data;
};
export const verifyOrderPayment = async (_orderId, reference) => {
  const { data, error } = await supabase.functions.invoke("paystack-verify", { body: { reference } });
  if (error) throw error;
  return data;
};

// --- ORDERS ---
export const addOrder = async (order) => {
  const { data: { user } } = await supabase.auth.getUser();
  // Client-generated id: INSERT ... RETURNING requires SELECT RLS on the returned row,
  // which guests (user_id = null) can never pass -> PostgREST 400/42501. Insert without
  // returning instead, and hand the id back for Paystack metadata + verification.
  const id = order.id ?? crypto.randomUUID();
  const { error } = await supabase.from("orders").insert({ id, user_id: order.userId ?? user?.id ?? null, customer: order.customer ?? {}, items: order.items ?? [], subtotal: finalNumber(order.subtotal), shipping_fee: finalNumber(order.shippingFee ?? order.shipping_fee), discount_amount: finalNumber(order.discountAmount), discount_code: order.discountCode ?? null, total: finalNumber(order.total), payment_status: "pending", order_status: "pending", is_test: order.isTest ?? PAYSTACK_IS_TEST });
  if (error) throw error;
  return id;
};
export const fetchOrders = () => getAllOrders();
export const getAllOrders = async () => {
  const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(rowToOrder);
};
export const fetchUserOrders = async (userId) => {
  const { data } = await supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []).map(rowToOrder);
};
export const fetchOrder = async (orderId) => {
  const { data } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  return data ? rowToOrder(data) : null;
};
// Guest order read: RLS blocks guests from reading orders directly, so prove
// ownership with the Paystack reference via the order-lookup edge function.
// Returns an order-shaped object with no customer PII.
export const fetchOrderByReference = async (orderId, reference) => {
  if (!orderId || !reference) return null;
  const { data, error } = await supabase.functions.invoke("order-lookup", { body: { orderId, reference } });
  if (error || !data?.found) return null;
  return { id: data.id, userId: null, customer: {}, items: data.items ?? [], tickets: data.tickets ?? [], subtotal: Number(data.subtotal ?? 0), shippingFee: Number(data.shippingFee ?? 0), shipping_fee: Number(data.shippingFee ?? 0), discountAmount: Number(data.discountAmount ?? 0), discountCode: data.discountCode ?? null, total: Number(data.total ?? 0), payment_status: data.payment_status, order_status: data.order_status, payment_reference: reference, paid_at: data.paid_at, isTest: data.isTest === true, created_at: toTimestamp(data.created_at), viaLookup: true };
};
export const subscribeOrders = (callback) => {
  const ch = supabase.channel("orders-admin").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => getAllOrders().then(callback)).subscribe();
  return () => supabase.removeChannel(ch);
};
export const subscribePresence = (callback) => {
  const ch = supabase.channel("presence-admin").on("postgres_changes", { event: "*", schema: "public", table: "presence" }, () => fetchPresence().then(callback)).subscribe();
  return () => supabase.removeChannel(ch);
};
const fetchPresence = async () => {
  const { data } = await supabase.from("presence").select("data, updated_at");
  const now = Date.now();
  const TWO_MINUTES = 2 * 60 * 1000;
  let active = 0;
  (data ?? []).forEach((row) => {
    const lastSeen = row.data?.last_seen ? new Date(row.data.last_seen).getTime() : 0;
    if ((now - lastSeen) < TWO_MINUTES) active++;
  });
  return active;
};
export const updateOrderPaymentStatus = async (orderId, status) => {
  const { error } = await supabase.from("orders").update({ payment_status: status }).eq("id", orderId);
  return !error;
};
export const updateOrderStatus = async (orderId, status) => {
  const { error } = await supabase.from("orders").update({ order_status: status }).eq("id", orderId);
  return !error;
};

// --- SUBSCRIBERS ---
export const addSubscriber = async (email, source = "newsletter") => {
  const { error } = await supabase.from("subscribers").insert({ email: String(email).toLowerCase().trim(), source });
  if (error && !String(error.message).includes("duplicate")) throw error;
  return true;
};
export const fetchSubscribers = async () => {
  const { data } = await supabase.from("subscribers").select("*").order("created_at", { ascending: false });
  return data ?? [];
};
export const mergeSubscriberDuplicates = async () => ({ merged: 0, note: "unique constraint on email prevents duplicates on Supabase" });

// --- EMAIL (Resend via Edge Function; Trigger Email / mail collection dropped) ---
export const sendTriggerEmail = async (to, subject, html) => {
  const { data, error } = await supabase.functions.invoke("send-bulk-email", { body: { emails: [to], subject, body: html } });
  if (error) throw error;
  return data;
};
export const sendOrderConfirmation = async () => ({ skipped: true, note: "server sends confirmation on webhook finalize" });
export const sendBulkEmail = async (emails, subject, body) => {
  const { data, error } = await supabase.functions.invoke("send-bulk-email", { body: { emails, subject, body } });
  if (error) throw error;
  return data;
};

// --- SETTINGS (settings/site_config -> settings id='site_config') ---
export const fetchSettings = async () => {
  try {
    const { data } = await supabase.from("settings").select("*").eq("id", "site_config").maybeSingle();
    return {
      site_name: import.meta.env.VITE_SITE_NAME || "NYNTH", support_email: import.meta.env.VITE_SUPPORT_EMAIL || "support@nynth.com",
      support_phone: import.meta.env.VITE_SUPPORT_PHONE || "+234 123 456 7890", office_address: import.meta.env.VITE_OFFICE_ADDRESS || "Abuja, Nigeria",
      instagram_url: import.meta.env.VITE_INSTAGRAM_URL || "https://instagram.com/nynth", twitter_url: import.meta.env.VITE_TWITTER_URL || "https://twitter.com/nynth",
      facebook_url: import.meta.env.VITE_FACEBOOK_URL || "https://facebook.com/nynth", tiktok_url: import.meta.env.VITE_TIKTOK_URL || "https://www.tiktok.com/@nynthworld",
      shipping_fee: Number(import.meta.env.VITE_DEFAULT_SHIPPING_FEE) || 2500, currency_symbol: import.meta.env.VITE_CURRENCY_SYMBOL || "\u20A6",
      ...(data?.data ?? {}),
    };
  } catch { return {}; }
};
export const updateSettings = async (settingsData) => {
  const { error } = await supabase.from("settings").upsert({ id: "site_config", data: settingsData });
  return !error;
};

// --- CONTACT ---
export const saveContactMessage = async (messageData) => {
  const { error } = await supabase.from("contact_messages").insert({ name: messageData.name ?? null, email: messageData.email ?? null, message: messageData.message ?? null, data: messageData });
  if (error) throw error;
  return true;
};

// --- ANALYTICS ---
export const incrementCounter = async (type) => {
  await supabase.rpc("increment_counter", { counter_id: type }).then((r) => r, async () => {
    const { data } = await supabase.from("analytics_counters").select("count").eq("id", type).maybeSingle();
    const next = Number(data?.count ?? 0) + 1;
    await supabase.from("analytics_counters").upsert({ id: type, count: next });
  });
};
export const fetchAnalyticsCounters = async () => {
  const { data } = await supabase.from("analytics_counters").select("*");
  return Object.fromEntries((data ?? []).map((r) => [r.id, r.count]));
};
export const fetchGA4Analytics = async (propertyId = null) => {
  const { data, error } = await supabase.functions.invoke("get-ga4-analytics", { body: { propertyId } });
  if (error) return { status: "unconfigured", metrics: {} };
  return data;
};
export const getAdminAnalytics = async () => ({ counters: await fetchAnalyticsCounters(), ga4: await fetchGA4Analytics() });

// --- DISCOUNT CODES ---
export const addDiscountCode = async (d) => {
  const { data, error } = await supabase.from("discount_codes").insert({ code: String(d.code).toUpperCase(), percent_off: d.percentOff ?? d.percent_off ?? null, amount_off: d.amountOff ?? d.amount_off ?? null, active: d.active ?? true, expires_at: d.expiresAt ?? d.expires_at ?? null }).select("id").single();
  if (error) throw error;
  return data.id;
};
export const updateDiscountCode = async (id, updates) => {
  const { error } = await supabase.from("discount_codes").update(updates).eq("id", id);
  return !error;
};
export const deleteDiscountCode = async (id) => {
  const { error } = await supabase.from("discount_codes").delete().eq("id", id);
  return !error;
};
export const fetchDiscountCodes = async () => {
  const { data } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
  return data ?? [];
};
export const validateDiscountCode = async (code) => {
  const { data } = await supabase.from("discount_codes").select("*").eq("code", String(code).toUpperCase()).eq("active", true).maybeSingle();
  if (!data) return { valid: false, error: "Invalid or inactive code" };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { valid: false, error: "This code has expired", reason: "expired" };
  return { valid: true, code: data, discountType: data.percent_off != null && Number(data.percent_off) > 0 ? "percentage" : "fixed", discountValue: Number(data.percent_off ?? data.amount_off ?? 0) };
};
