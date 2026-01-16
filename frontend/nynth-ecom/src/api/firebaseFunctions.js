// src/api/firebaseFunctions.js - COMPLETE VERSION
import { db, auth, storage } from "./firebase";
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
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- PRODUCTS CRUD ---

export const addProduct = async (product) => {
  const docRef = await addDoc(collection(db, "products"), {
    ...product,
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
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
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

// --- PRODUCT FILTERING & QUERIES ---

export const fetchFeaturedProducts = async (max = 6) => {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter products with "featured" tag or bestSeller/featured flags
    const featuredProducts = allProducts.filter(product =>
      product.featured === true ||
      product.bestSeller === true ||
      (product.tags && product.tags.includes("featured"))
    );

    // If not enough featured, get latest products
    if (featuredProducts.length < 3) {
      const latestProducts = allProducts
        .sort((a, b) => {
          const timeA = a.created_at?.seconds || 0;
          const timeB = b.created_at?.seconds || 0;
          return timeB - timeA;
        })
        .slice(0, max);
      return latestProducts;
    }

    return featuredProducts.slice(0, max);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
};

export const fetchProductsByCategory = async (category, max = 10) => {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const filtered = allProducts.filter(product =>
      product.category?.toLowerCase() === category.toLowerCase()
    );

    // Sort by featured/bestSeller first, then by newest
    const sorted = filtered.sort((a, b) => {
      const aScore = (a.featured ? 2 : 0) + (a.bestSeller ? 1 : 0);
      const bScore = (b.featured ? 2 : 0) + (b.bestSeller ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;

      const timeA = a.created_at?.seconds || 0;
      const timeB = b.created_at?.seconds || 0;
      return timeB - timeA;
    });

    return sorted.slice(0, max);
  } catch (error) {
    console.error(`Error fetching ${category} products:`, error);
    return [];
  }
};

export const fetchProductsByTag = async (tag, max = 10) => {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return allProducts
      .filter(product => product.tags && product.tags.includes(tag))
      .slice(0, max);
  } catch (error) {
    console.error(`Error fetching products by tag ${tag}:`, error);
    return [];
  }
};

export const fetchRelatedProducts = async (category, excludeId, max = 4) => {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return allProducts
      .filter(product =>
        product.id !== excludeId &&
        product.category === category
      )
      .slice(0, max);
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
};

export const fetchNewArrivals = async (max = 8) => {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort by created_at (newest first)
    const sorted = allProducts.sort((a, b) => {
      const timeA = a.created_at?.seconds || 0;
      const timeB = b.created_at?.seconds || 0;
      return timeB - timeA;
    });

    return sorted.slice(0, max);
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
    const snapshot = await getDocs(collection(db, "lookbooks"));
    const allLookbooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return allLookbooks.filter(lookbook => lookbook.featured === true);
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
  try {
    const docRef = doc(db, "orders", orderId);

    // Update Order
    await updateDoc(docRef, {
      payment_status: "paid",
      order_status: "confirmed",
      payment_reference: reference,
      updated_at: serverTimestamp(),
    });

    // Send Confirmation Email
    try {
      const orderSnap = await getDoc(docRef);
      if (orderSnap.exists()) {
        const orderData = { id: orderSnap.id, ...orderSnap.data() };
        await sendOrderConfirmation(orderData);
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the verification if email fails
    }

    return true;
  } catch (error) {
    console.error(`Error verifying payment for order ${orderId}:`, error);
    return false;
  }
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

export const addSubscriber = async (email) => {
  try {
    // Check if email already exists
    const q = query(collection(db, "subscribers"), where("email", "==", email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return { success: false, message: "Email already subscribed" };
    }

    // Add new subscriber
    await addDoc(collection(db, "subscribers"), {
      email,
      subscribed_at: serverTimestamp(),
      status: "active"
    });

    // Send Welcome Email
    await sendTriggerEmail(
      email,
      "Welcome to NYNTH",
      `<h1>Welcome to the Family</h1><p>You're now on the list. Expect exclusive drops and early access.</p>`
    );

    return { success: true, message: "Successfully subscribed!" };
  } catch (error) {
    console.error("Error adding subscriber:", error);
    return { success: false, message: "Subscription failed. Please try again." };
  }
};

// --- EMAIL NOTIFICATIONS (via Trigger Email Extension) ---

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
        shipping_fee: Number(import.meta.env.VITE_DEFAULT_SHIPPING_FEE) || 2500,
        currency_symbol: import.meta.env.VITE_CURRENCY_SYMBOL || "₦"
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
    return true;
  } catch (error) {
    console.error("Error updating order status: ", error);
    return false;
  }
};

// Admin Analytics
export const getAdminAnalytics = async () => {
  try {
    const orders = await getAllOrders();

    // Calculate total revenue (only paid/success orders)
    const paidOrders = orders.filter(o => o.payment_status === 'paid' || o.payment_status === 'success');
    console.log('Analytics - Total Paid Orders:', paidOrders.length);
    console.log('Analytics - Sample Paid Order:', paidOrders[0]);

    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    console.log('Analytics - Calculated Revenue:', totalRevenue);

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
      revenueByDate
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
  addOrder,
  verifyOrderPayment,
  fetchUserOrders,
  getAllOrders,
  updateOrderStatus,
  getAdminAnalytics
};