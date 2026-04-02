// src/api/firebaseFunctions.js - COMPLETE VERSION
import { db, auth, storage, functions } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  increment,
  writeBatch
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";

// --- PRODUCTS CRUD ---

export const addProduct = async (product) => {
  const docRef = await addDoc(collection(db, "products"), {
    ...product,
    stockQuantity: Number(product.stockQuantity) || 0,
    inStock: (Number(product.stockQuantity) || 0) > 0,
    created_at: serverTimestamp(),
  });
  return docRef.id;
};

export const fetchProducts = async () => {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const fetchSingleProduct = async (id) => {
  try {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
};

export const updateProduct = async (id, updates) => {
  try {
    const docRef = doc(db, "products", id);
    const finalUpdates = {
      ...updates,
      updated_at: serverTimestamp(),
    };

    if (updates.stockQuantity !== undefined) {
      finalUpdates.stockQuantity = Number(updates.stockQuantity) || 0;
      finalUpdates.inStock = finalUpdates.stockQuantity > 0;
    }

    await updateDoc(docRef, finalUpdates);
    return true;
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    return false;
  }
};

export const deleteProduct = async (id) => {
  try {
    await deleteDoc(doc(db, "products", id));
    return true;
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    return false;
  }
};

export const updateProductOrderBatch = async (productsArray) => {
  try {
    const batch = writeBatch(db);
    productsArray.forEach((product, index) => {
      const docRef = doc(db, "products", product.id);
      batch.update(docRef, { displayOrder: index });
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Batch update error:", error);
    return false;
  }
};

// --- PRODUCT FILTERING & QUERIES ---

export const fetchFeaturedProducts = async (max = 6) => {
  try {
    // 1. Try to fetch explicitly featured items
    const q = query(
      collection(db, "products"), 
      where("featured", "==", true), 
      limit(max)
    );
    const snapshot = await getDocs(q);
    let featuredProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 2. If not enough, fetch best sellers
    if (featuredProducts.length < max) {
      const qBS = query(
        collection(db, "products"), 
        where("bestSeller", "==", true), 
        limit(max - featuredProducts.length)
      );
      const bsSnapshot = await getDocs(qBS);
      const bsProducts = bsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      featuredProducts = [...featuredProducts, ...bsProducts];
    }

    // 3. Fallback to newest if still not enough
    if (featuredProducts.length < 3) {
      const latestQ = query(
        collection(db, "products"),
        orderBy("created_at", "desc"),
        limit(max)
      );
      const latestSnapshot = await getDocs(latestQ);
      return latestSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return featuredProducts;
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
};

export const fetchProductsByCategory = async (category, max = 15) => {
  try {
    const q = query(
      collection(db, "products"),
      where("category", "==", category.toLowerCase()),
      limit(max)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error fetching ${category} products:`, error);
    return [];
  }
};

export const fetchProductsByTag = async (tag, max = 10) => {
  try {
    const q = query(
      collection(db, "products"),
      where("tags", "array-contains", tag),
      limit(max)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error fetching products by tag ${tag}:`, error);
    return [];
  }
};

export const fetchRelatedProducts = async (category, excludeId, max = 4) => {
  try {
    const q = query(
      collection(db, "products"),
      where("category", "==", category),
      limit(max + 1)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => p.id !== excludeId)
      .slice(0, max);
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
};

export const fetchNewArrivals = async (max = 8) => {
  try {
    const q = query(
      collection(db, "products"),
      orderBy("created_at", "desc"),
      limit(max)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    return [];
  }
};

// --- LOOKBOOKS ---

export const fetchLookbooks = async () => {
  try {
    const snapshot = await getDocs(collection(db, "lookbooks"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching lookbooks:", error);
    return [];
  }
};

export const fetchFeaturedLookbooks = async () => {
  try {
    const q = query(collection(db, "lookbooks"), where("featured", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching featured lookbooks:", error);
    return [];
  }
};

// --- IMAGE UPLOAD ---

export const uploadImage = async (file) => {
  try {
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const uploadMultipleImages = async (files) => {
  try {
    const uploadPromises = files.map(file => uploadImage(file));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error("Error uploading multiple images:", error);
    throw error;
  }
};

// --- ORDERS ---
import { runTransaction } from "firebase/firestore";

export const initializePayment = async (paymentData) => {
  try {
    const initPayment = httpsCallable(functions, "initializePayment");
    const result = await initPayment(paymentData);
    return result.data;
  } catch (error) {
    console.error("Error initializing payment:", error);
    throw error;
  }
};

export const addOrder = async (order) => {
  try {
    const orderId = await runTransaction(db, async (transaction) => {
      // 1. Check stock for all items
      for (const item of order.items) {
        const productRef = doc(db, "products", item.id);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          throw new Error(`Product ${item.title} does not exist!`);
        }

        const productData = productDoc.data();
        if (productData.inStock === false) {
          throw new Error(`Item ${item.title} is out of stock!`);
        }
        // Future: Check quantity here if/when we track exact numbers
      }

      // 2. Create Order
      const newOrderRef = doc(collection(db, "orders")); // Generate ID first
      transaction.set(newOrderRef, {
        ...order,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        payment_status: order.payment_status || "pending",
        order_status: order.order_status || "processing",
      });

      return newOrderRef.id;
    });

    return orderId;
  } catch (error) {
    console.error("Error adding order:", error);
    throw error;
  }
};

export const fetchOrders = async () => {
  try {
    const snapshot = await getDocs(collection(db, "orders"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

export const fetchUserOrders = async (userId) => {
  try {
    // Optimized query: filters server-side
    const q = query(collection(db, "orders"), where("userId", "==", userId));
    const snapshot = await getDocs(q);

    // Sort client-side or add orderBy to query (requires composite index)
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
  } catch (error) {
    console.error(`Error fetching orders for user ${userId}:`, error);
    return [];
  }
};



export const verifyOrderPayment = async (orderId, reference) => {
  console.warn("⚠️ verifyOrderPayment is deprecated. Payments are now verified securely via Webhooks.");
  return true; // Return true to allow frontend navigation while webhook processes
  /* OLD INSECURE LOGIC:
  try {
    const docRef = doc(db, "orders", orderId);
    ...
  } catch (error) { ... }
  */
};

// --- ANALYTICS & STATS ---

export const getProductStats = async () => {
  try {
    const products = await fetchProducts();
    const stats = {
      total: products.length,
      inStock: products.filter(p => p.inStock).length,
      outOfStock: products.filter(p => !p.inStock).length,
      byCategory: {},
    };

    // Count by category
    products.forEach(product => {
      const category = product.category || "uncategorized";
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error("Error getting product stats:", error);
    return null;
  }
};

// --- UTILITY FUNCTIONS ---

export const searchProducts = async (searchTerm) => {
  try {
    const products = await fetchProducts();
    const term = searchTerm.toLowerCase();

    return products.filter(product =>
      product.title?.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term) ||
      product.tags?.some(tag => tag.toLowerCase().includes(term)) ||
      product.category?.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error(`Error searching for "${searchTerm}":`, error);
    return [];
  }
};

export const getCategories = async () => {
  try {
    const products = await fetchProducts();
    const categories = new Set();

    products.forEach(product => {
      if (product.category) {
        categories.add(product.category);
      }
    });

    return Array.from(categories);
  } catch (error) {
    console.error("Error getting categories:", error);
    return [];
  }
};

// --- BATCH OPERATIONS ---

export const updateMultipleProducts = async (productIds, updates) => {
  try {
    const updatePromises = productIds.map(id =>
      updateDoc(doc(db, "products", id), {
        ...updates,
        updated_at: serverTimestamp(),
      })
    );

    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error("Error updating multiple products:", error);
    return false;
  }
};

export const deleteMultipleProducts = async (productIds) => {
  try {
    const deletePromises = productIds.map(id =>
      deleteDoc(doc(db, "products", id))
    );

    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error("Error deleting multiple products:", error);
    return false;
  }
};

// --- NEWSLETTER SUBSCRIPTIONS ---

export const addSubscriber = async (email, source = 'newsletter') => {
  try {
    const formattedEmail = email.trim().toLowerCase();
    
    // 1. Check by Document ID (Most efficient)
    const docRef = doc(db, "subscribers", formattedEmail);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { success: true, message: 'ALREADY_ADDED' };
    }


    await setDoc(docRef, {
      email: formattedEmail,
      subscribed_at: serverTimestamp(),
      status: 'active',
      source: source
    });

    // Send Welcome Email
    await sendTriggerEmail(
      email,
      "Welcome to NYNTH",
      `<h1>Welcome to the Family</h1><p>You're now on the list. Expect exclusive drops and early access.</p>`
    );

    return { success: true, message: 'Subscribed successfully' };
  } catch (error) {
    console.error("Error adding subscriber:", error);
    return { success: false, message: error.message };
  }
};

// --- EMAIL NOTIFICATIONS (via Trigger Email Extension) ---

export const fetchSubscribers = async () => {
  try {
    const q = query(collection(db, "subscribers"), orderBy("subscribed_at", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return [];
  }
};

/**
 * Merges duplicate subscribers by email.
 * Preserves the oldest entry and deletes others.
 */
export const mergeSubscriberDuplicates = async () => {
  try {
    const snapshot = await getDocs(collection(db, "subscribers"));
    const allSubs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const emailGroups = {};
    allSubs.forEach(sub => {
      const email = sub.email?.trim().toLowerCase();
      if (!email) return;
      if (!emailGroups[email]) emailGroups[email] = [];
      emailGroups[email].push(sub);
    });

    let mergedCount = 0;
    const batch = writeBatch(db);

    Object.values(emailGroups).forEach(group => {
      if (group.length > 1) {
        // Sort by date (oldest first)
        group.sort((a, b) => {
          const timeA = a.subscribed_at?.seconds || 0;
          const timeB = b.subscribed_at?.seconds || 0;
          return timeA - timeB;
        });

        // Keep the first (oldest), delete the rest
        const toKeep = group[0];
        const toDelete = group.slice(1);

        toDelete.forEach(sub => {
          batch.delete(doc(db, "subscribers", sub.id));
          mergedCount++;
        });
      }
    });

    if (mergedCount > 0) {
      await batch.commit();
    }

    return { success: true, mergedCount };
  } catch (error) {
    console.error("Error merging duplicates:", error);
    throw error;
  }
};

export const sendTriggerEmail = async (to, subject, html) => {
  try {
    await addDoc(collection(db, "mail"), {
      to,
      message: {
        subject,
        html,
      },
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error queueing email:", error);
    return false;
  }
};

export const sendOrderConfirmation = async (order) => {
  const subject = `Order Confirmation #${order.id}`;
  const html = `
    <h1>Thank you for your order, ${order.customer.firstName}!</h1>
    <p>We have received your order and are processing it.</p>
    <p><strong>Order ID:</strong> ${order.id}</p>
    <p><strong>Total:</strong> ₦${order.total.toLocaleString()}</p>
    <br>
    <p>We will notify you when it ships.</p>
    <p>The NYNTH Team</p>
  `;
  return sendTriggerEmail(order.customer.email, subject, html);
};

// --- SETTINGS MANAGEMENT ---

export const fetchSettings = async () => {
  try {
    const docRef = doc(db, "settings", "site_config");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Return defaults if document doesn't exist
      return {
        site_name: import.meta.env.VITE_SITE_NAME || "NYNTH",
        support_email: import.meta.env.VITE_SUPPORT_EMAIL || "support@nynth.com",
        support_phone: import.meta.env.VITE_SUPPORT_PHONE || "+234 123 456 7890",
        office_address: import.meta.env.VITE_OFFICE_ADDRESS || "123 Fashion Street, Lagos, Nigeria",
        instagram_url: import.meta.env.VITE_INSTAGRAM_URL || "https://instagram.com/nynth",
        twitter_url: import.meta.env.VITE_TWITTER_URL || "https://twitter.com/nynth",
        facebook_url: import.meta.env.VITE_FACEBOOK_URL || "https://facebook.com/nynth",
        tiktok_url: import.meta.env.VITE_TIKTOK_URL || "https://www.tiktok.com/@nynthworld?_r=1&_t=ZS-951aMhEFEki",
        shipping_fee: Number(import.meta.env.VITE_DEFAULT_SHIPPING_FEE) || 2500,
        currency_symbol: import.meta.env.VITE_CURRENCY_SYMBOL || "₦",
        show_size_chart: true,
        size_chart_model_info: "Our model is 185cm tall and wears a size M. NYNTH pieces are cut to an oversized silhouette — size down if you prefer a more fitted look.",
        size_chart_data: [
          { size: "XS", chest: "81-86", waist: "66-71", length: "68" },
          { size: "S", chest: "86-91", waist: "71-76", length: "70" },
          { size: "M", chest: "91-97", waist: "76-81", length: "72" },
          { size: "L", chest: "97-102", waist: "81-86", length: "74" },
          { size: "XL", chest: "102-107", waist: "86-91", length: "76" },
          { size: "XXL", chest: "107-112", waist: "91-97", length: "78" },
        ]
      };
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    return null;
  }
};

export const updateSettings = async (settingsData) => {
  try {
    const docRef = doc(db, "settings", "site_config");
    await setDoc(docRef, {
      ...settingsData,
      updated_at: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating settings:", error);
    return false;
  }
};

export const saveContactMessage = async (messageData) => {
  try {
    await addDoc(collection(db, "contact_messages"), {
      ...messageData,
      created_at: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error saving contact message:", error);
    return false;
  }
};

// --- EXPORT ALL FUNCTIONS ---
// --- Admin Functions ---

export const getAllOrders = async () => {
  try {
    const q = query(collection(db, "orders"), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    return orders;
  } catch (error) {
    console.error("Error getting all orders: ", error);
    return [];
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      order_status: status,
      updated_at: serverTimestamp()
    });

    // Automatically set payment_status to 'paid' if marked as delivered
    if (status === 'delivered') {
      await updateDoc(orderRef, { payment_status: 'paid' });
    }

    return true;
  } catch (error) {
    console.error("Error updating order status: ", error);
    return false;
  }
};

// --- ANALYTICS COUNTERS ---

export const incrementCounter = async (type) => {
  try {
    const docRef = doc(db, "analytics", "counters");
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    await setDoc(docRef, {
      [type]: increment(1),
      [`${type}ByDate`]: {
        [today]: increment(1)
      },
      last_updated: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error(`Error incrementing ${type} counter:`, error);
  }
};

export const fetchAnalyticsCounters = async () => {
  try {
    const docRef = doc(db, "analytics", "counters");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        visits: data.visits || 0,
        clicks: data.clicks || 0,
        visitsByDate: data.visitsByDate || {},
        clicksByDate: data.clicksByDate || {}
      };
    }
    return { visits: 0, clicks: 0, visitsByDate: {}, clicksByDate: {} };
  } catch (error) {
    console.error("Error fetching analytics counters:", error);
    return { visits: 0, clicks: 0, visitsByDate: {}, clicksByDate: {} };
  }
};

export const fetchGA4Analytics = async (propertyId = null) => {
  try {
    const getGA4Analytics = httpsCallable(functions, "getGA4Analytics");
    const result = await getGA4Analytics({ propertyId });
    return result.data;
  } catch (error) {
    console.error("Error calling getGA4Analytics:", error);
    return { status: "error", message: error.message };
  }
};

export const sendBulkEmail = async (emails, subject, body) => {
  try {
    const sendEmailFn = httpsCallable(functions, "sendBulkEmail");
    const result = await sendEmailFn({ emails, subject, body });
    return result.data;
  } catch (error) {
    console.error("Error sending bulk email:", error);
    throw error;
  }
};

// Admin Analytics
export const getAdminAnalytics = async () => {
  try {
    const orders = await getAllOrders();
    const counters = await fetchAnalyticsCounters();

    // Calculate total revenue (only paid/success orders)
    const paidOrders = orders.filter(o => o.payment_status === 'paid' || o.payment_status === 'success');

    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Status breakdown
    const statusBreakdown = orders.reduce((acc, o) => {
      const status = o.order_status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Revenue by date (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const revenueByDate = paidOrders
      .filter(o => {
        if (!o.created_at?.seconds) return false;
        const orderDate = new Date(o.created_at.seconds * 1000);
        return orderDate >= thirtyDaysAgo;
      })
      .reduce((acc, o) => {
        const date = new Date(o.created_at.seconds * 1000)
          .toISOString()
          .split('T')[0];
        acc[date] = (acc[date] || 0) + (o.total || 0);
        return acc;
      }, {});

    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.order_status !== 'delivered').length,
      completedOrders: orders.filter(o => o.order_status === 'delivered').length,
      statusBreakdown,
      revenueByDate,
      visits: counters.visits,
      clicks: counters.clicks,
      visitsByDate: counters.visitsByDate,
      clicksByDate: counters.clicksByDate,
      rawOrders: orders // Return for UI reuse
    };
  } catch (error) {
    console.error("Error getting admin analytics: ", error);
    return null;
  }
};

export default {
  fetchProducts,
  fetchSingleProduct,
  fetchLookbooks,
  fetchSettings,
  addSubscriber,
  fetchSubscribers,
  addOrder,
  verifyOrderPayment,
  fetchUserOrders,
  getAllOrders,
  updateOrderStatus,
  getAdminAnalytics,
  fetchGA4Analytics,
  mergeSubscriberDuplicates,
  sendBulkEmail
};