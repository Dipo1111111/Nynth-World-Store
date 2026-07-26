// app.jsx - AUTH INTEGRATION
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import React, { lazy, Suspense } from "react";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { useOffline } from "./hooks/useOffline";
import { WifiOff, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logPageView } from "./utils/monitoring";
import { incrementCounter } from "./api/firebaseFunctions";
import { db } from "./api/firebase";
import { useSettings } from "./context/SettingsContext";
import { useAuth } from "./context/AuthContext";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";


// ALL pages lazy-loaded for code splitting
const Shop = lazy(() => import("./pages/Shop.jsx"));
const Lookbook = lazy(() => import("./pages/Lookbook.jsx"));
const ProductDetail = lazy(() => import("./pages/ProductDetail.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const ThankYou = lazy(() => import("./pages/ThankYou.jsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.jsx"));
const TermsOfService = lazy(() => import("./pages/TermsOfService.jsx"));
const ShippingReturns = lazy(() => import("./pages/ShippingReturns.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Signup = lazy(() => import("./pages/Signup.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const Account = lazy(() => import("./pages/Account.jsx"));
const OurStory = lazy(() => import("./pages/OurStory.jsx"));
const Sustainability = lazy(() => import("./pages/Sustainability.jsx"));
const ErrorPage = lazy(() => import("./pages/ErrorPage.jsx"));
const UpdateDB = lazy(() => import("./pages/UpdateDB.jsx"));
const LockPage = lazy(() => import("./pages/LockPage.jsx"));
const WaitlistConfirmation = lazy(() => import("./pages/WaitlistConfirmation.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));

// Lazy Loaded Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const AbandonedCheckouts = lazy(() => import("./pages/admin/AbandonedCheckouts"));
const Products = lazy(() => import("./pages/admin/Products"));
const Lookbooks = lazy(() => import("./pages/admin/Lookbooks"));
const Subscribers = lazy(() => import("./pages/admin/Subscribers"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const DiscountCodes = lazy(() => import("./pages/admin/DiscountCodes"));

// Admin Loading Fallback
const AdminLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-black" />
      <p className="text-gray-500 font-medium">Loading...</p>
    </div>
  </div>
);

// Generate or retrieve a stable session ID for this browser
const SESSION_ID = (() => {
  let id = localStorage.getItem('nynth_session_id');
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('nynth_session_id', id);
  }
  return id;
})();

// Component to handle side effects on route change + presence tracking
function PageTracker() {
  const { pathname } = useLocation();

  // Presence tracking — runs once on mount
  useEffect(() => {
    const presenceRef = doc(db, 'presence', SESSION_ID);

    const writePresence = () => {
      setDoc(presenceRef, {
        session: SESSION_ID,
        page: window.location.pathname,
        last_seen: serverTimestamp(),
      }, { merge: true }).catch(() => { });
    };

    const removePresence = () => {
      deleteDoc(presenceRef).catch(() => { });
    };

    writePresence();
    // Heartbeat every 30 seconds to keep the session alive
    const heartbeat = setInterval(writePresence, 30000);

    // Clean up when tab closes
    window.addEventListener('beforeunload', removePresence);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', removePresence);
      removePresence();
    };
  }, []);

  // Page view tracking
  useEffect(() => {
    window.scrollTo(0, 0);
    logPageView();
    incrementCounter('visits');

    // Update presence page when route changes
    const presenceRef = doc(db, 'presence', SESSION_ID);
    setDoc(presenceRef, { page: pathname, last_seen: serverTimestamp() }, { merge: true }).catch(() => { });
  }, [pathname]);

  return null;
}

import { Toaster } from "react-hot-toast"; // Added import

function App() {
  const isOffline = useOffline();
  const [isSiteUnlocked, setIsSiteUnlocked] = React.useState(() => {
    return localStorage.getItem('nynth_site_unlocked') === 'true';
  });

  useEffect(() => {
    document.title = "Nynth World Store";
  }, []);

  return (
    <HelmetProvider>
      <SettingsProvider>
        <AuthProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '0px',
                background: '#000',
                color: '#fff',
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                padding: '14px 20px',
                boxShadow: 'none',
                border: 'none',
              },
              success: {
                iconTheme: {
                  primary: '#fff',
                  secondary: '#000',
                },
              },
              error: {
                iconTheme: {
                  primary: '#fff',
                  secondary: '#000',
                },
              },
            }}
          />
          {isOffline && (
            <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-2 animate-slideDown">
              <WifiOff size={16} />
              <span className="text-sm font-medium">You are currently offline. Some features may not work.</span>
            </div>
          )}
          <AppContent isSiteUnlocked={isSiteUnlocked} setIsSiteUnlocked={setIsSiteUnlocked} />
        </AuthProvider>
      </SettingsProvider>
    </HelmetProvider>
  );
}

function AppContent({ isSiteUnlocked, setIsSiteUnlocked }) {
  const { settings, loading: settingsLoading } = useSettings();
  const { currentUser, isAdmin, isAdminLoading } = useAuth();
  const location = window.location;

  // The site is "Globally Locked" if the setting is true
  const isGloballyLocked = settings?.lock_page_enabled;

  // Force-lock: if the admin enabled the lock, increment lock_epoch to invalidate all previous unlocks
  const lockEpoch = settings?.lock_epoch || 0;
  const storedEpoch = Number(localStorage.getItem('nynth_lock_epoch') || '0');
  const isUnlockValid = isSiteUnlocked && storedEpoch === lockEpoch;

  // Logic to determine if we should show the lock page:
  // 1. Site is globally locked AND user is NOT an admin AND NOT previously unlocked via password
  // (Admins should always be able to see the site to manage it)
  // 2. If lock_epoch doesn't match stored epoch, force lock even if previously unlocked
  const shouldShowLock = isGloballyLocked && !isAdmin && !isUnlockValid;

  if (settingsLoading || isAdminLoading) {
    return <AdminLoader />;
  }

  return (
    <CartProvider>
      {shouldShowLock ? (
        <BrowserRouter>
          <Suspense fallback={<AdminLoader />}>
            <Routes>
              <Route path="/waitlist-confirmation" element={<WaitlistConfirmation />} />
              <Route path="*" element={<LockPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      ) : (
        <ErrorBoundary>
          <BrowserRouter>
            <PageTracker />
            <Suspense fallback={<AdminLoader />}>
            <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Navigate to="/shop" replace />} />
                    <Route path="/home" element={<Navigate to="/shop" replace />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/lookbook" element={<Lookbook />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/update-db" element={<UpdateDB />} />

                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* Protected User Routes */}
                    <Route
                      path="/account"
                      element={
                        <ProtectedRoute>
                          <Account />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/thank-you" element={<ThankYou />} />

                    {/* Legal & Support Routes */}
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/shipping" element={<ShippingReturns />} />
                    <Route path="/returns" element={<ShippingReturns />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/our-story" element={<OurStory />} />
                    <Route path="/sustainability" element={<Sustainability />} />
                    <Route path="/403" element={<ErrorPage status={403} />} />
                    <Route path="/500" element={<ErrorPage status={500} />} />

                    {/* Protected Admin Routes */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <Suspense fallback={<AdminLoader />}>
                            <AdminDashboard />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/orders"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <Suspense fallback={<AdminLoader />}>
                            <Orders />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/abandoned-checkouts"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <Suspense fallback={<AdminLoader />}>
                            <AbandonedCheckouts />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/products"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <Suspense fallback={<AdminLoader />}>
                            <Products />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/lookbooks"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <Suspense fallback={<AdminLoader />}>
                            <Lookbooks />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/subscribers"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <Suspense fallback={<AdminLoader />}>
                            <Subscribers />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/settings"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <Suspense fallback={<AdminLoader />}>
                            <Settings />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/discount-codes"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <Suspense fallback={<AdminLoader />}>
                            <DiscountCodes />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />

                    {/* 404 Catch-All Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
                </BrowserRouter>
              </ErrorBoundary>
            )}
          </CartProvider>
  );
}

export default App;