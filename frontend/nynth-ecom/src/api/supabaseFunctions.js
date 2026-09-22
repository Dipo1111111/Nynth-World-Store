// src/api/supabaseFunctions.js — drop-in replacement for firebaseFunctions.js
// Same export names + signatures, backed by Supabase. Cloudinary stays as-is.
// Products: id (text, preserved Firestore ID), name/title, category, price,
//   stock_quantity, is_public, featured, best_seller, tags[], display_order, data{...}
// Orders: id, user_id (null=guest), customer{}, items[], tickets[], subtotal/shipping_fee/
//   discount_amount/discount_code/total, payment_status, order_status, payment_reference.

import { supabase } from "./supabase";
import { uploadImageToCloudinary, uploadMultipleImagesToCloudinary } from "./cloudinary";

const rowToProduct = (r) => ({ id: r.id, stockQuantity: r.stock_quantity, inStock: r.stock_quantity > 0, isPublic: r.is_public, bestSeller: r.best_seller, displayOrder: r.display_order, ...(r.data ?? {}), name: r.name ?? r.data?.name, title: r.title ?? r.data?.title, category: r.category ?? r.data?.category, price: Number(r.price ?? r.data?.price ?? 0), featured: r.featured, tags: r.tags ?? [], created_at: r.created_at });
const rowToOrder = (r) => ({ id: r.id, userId: r.user_id, customer: r.customer ?? {}, items: r.items ?? [], tickets: r.tickets ?? [], subtotal: Number(r.subtotal ?? 0), shippingFee: Number(r.shipping_fee ?? 0), shipping_fee: Number(r.shipping_fee ?? 0), discountAmount: Number(r.discount_amount ?? 0), discountCode: r.discount_code, total: Number(r.total ?? 0), payment_status: r.payment_status, order_status: r.order_status, payment_reference: r.payment_reference, paid_at: r.paid_at, created_at: r.created_at });

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
  return admin ? all : all.filter((p) => p.isPublic !== false);
};
export const fetchSingleProduct = async (id, { admin = false } = {}) => {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const p = rowToProduct(data);
  return admin ? p : (p.isPublic !== false ? p : null);
};
export const updateProduct = async (id, updates) => {
  try {
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
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    if (error) throw error;
    return true;
  } catch (e) { console.error("Error updating product " + id + ":", e); return false; }
};
export const deleteProduct = async (id) => {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) { console.error("Error deleting product " + id + ":", error); return false; }
  return true;
};
export const updateProductOrderBatch = async (productsArray) => {
  try {
    await Promise.all(productsArray.map((p, i) => supabase.from("products").update({ display_order: i }).eq("id", p.id)));
    return true;
  } catch (e) { console.error("Batch update error:", e); return false; }
};

// --- FILTERING ---
export const fetchFeaturedProducts = async (max = 6) => {
  const { data } = await supabase.from("products").select("*").eq("featured", true).limit(max);
  let list = (data ?? []).map(rowToProduct).filter((p) => p.isPublic !== false);
  if (list.length < max) {
    const { data: bs } = await supabase.from("products").select("*").eq("best_seller", true).limit(max - list.length);
    list = [...list, ...((bs ?? []).map(rowToProduct).filter((p) => p.isPublic !== false))];
  }
  if (list.length < 3) {
    const { data: latest } = await supabase.from("products").select("*").order("created_at", { ascending: false }).limit(max);
    return (latest ?? []).map(rowToProduct).filter((p) => p.isPublic !== false);
  }
  return list;
};
export const fetchProductsByCategory = async (category, max = 15) => {
  const { data } = await supabase.from("products").select("*").eq("category", String(category).toLowerCase()).limit(max);
  return (data ?? []).map(rowToProduct).filter((p) => p.isPublic !== false);
};
export const fetchProductsByTag = async (tag, max = 10) => {
  const { data } = await supabase.from("products").select("*").contains("tags", [tag]).limit(max);
  return (data ?? []).map(rowToProduct).filter((p) => p.isPublic !== false);
};
export const fetchRelatedProducts = async (category, excludeId, max = 4) => {
  const { data } = await supabase.from("products").select("*").eq("category", category).limit(max + 1);
  return (data ?? []).map(rowToProduct).filter((p) => p.id !== excludeId).slice(0, max);
};
export const fetchNewArrivals = async (max = 8) => {
  const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }).limit(max);
  return (data ?? []).map(rowToProduct).filter((p) => p.isPublic !== false);
};
export const fetchRecommendedProducts = async (product, max = 4) => fetchRelatedProducts(product?.category, product?.id, max);
export const searchProducts = async (term) => {
  const { data } = await supabase.from("products").select("*").ilike("name", "%" + term + "%").limit(20);
  return (data ?? []).map(rowToProduct);
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
  const { data, error } = await supabase.from("orders").insert({ user_id: order.userId ?? user?.id ?? null, customer: order.customer ?? {}, items: order.items ?? [], subtotal: Number(order.subtotal ?? 0), shipping_fee: Number(order.shippingFee ?? order.shipping_fee ?? 0), discount_amount: Number(order.discountAmount ?? 0), discount_code: order.discountCode ?? null, total: Number(order.total ?? 0), payment_status: "pending", order_status: "pending" }).select("id").single();
  if (error) throw error;
  return data.id;
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
export const subscribeOrders = (callback) => {
  const ch = supabase.channel("orders-admin").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => getAllOrders().then(callback)).subscribe();
  return () => supabase.removeChannel(ch);
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
  if (!data) return { valid: false };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { valid: false, reason: "expired" };
  return { valid: true, code: data };
};
