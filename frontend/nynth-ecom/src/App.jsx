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

// Public Pages
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import Lookbook from "./pages/Lookbook.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import ThankYou from "./pages/ThankYou.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import TermsOfService from "./pages/TermsOfService.jsx";
import ShippingReturns from "./pages/ShippingReturns.jsx";
import Contact from "./pages/Contact.jsx";
import NotFound from "./pages/NotFound.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Account from "./pages/Account.jsx";
import OurStory from "./pages/OurStory.jsx";
import Sustainability from "./pages/Sustainability.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";

// Lazy Loaded Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Products = lazy(() => import("./pages/admin/Products"));
const Lookbooks = lazy(() => import("./pages/admin/Lookbooks"));
const Settings = lazy(() => import("./pages/admin/Settings"));

// Admin Loading Fallback
const AdminLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-black" />
      <p className="text-gray-500 font-medium font-space">Loading Dashboard...</p>
    </div>
  </div>
);

// Component to handle side effects on route change
function PageTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    logPageView();
  }, [pathname]);

  return null;
}

import { Toaster } from "react-hot-toast"; // Added import

function App() {
  console.log("🚀 App.jsx: Component rendering...");
  const isOffline = useOffline();

  useEffect(() => {
    document.title = "Nynth World Store";
  }, []);

  return (
    <HelmetProvider>
      <Toaster position="top-center" />
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-2 animate-slideDown">
          <WifiOff size={16} />
          <span className="text-sm font-medium">You are currently offline. Some features may not work.</span>
        </div>
      )}
      <ErrorBoundary>
        <SettingsProvider>
          <AuthProvider>
            <CartProvider>
              <BrowserRouter>
                <PageTracker />
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Navigate to="/shop" replace />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/lookbook" element={<Lookbook />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />

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
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/shipping" element={<ShippingReturns />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/about" element={<OurStory />} />
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
                    path="/admin/settings"
                    element={
                      <ProtectedRoute requireAdmin={true}>
                        <Suspense fallback={<AdminLoader />}>
                          <Settings />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 Catch-All Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;