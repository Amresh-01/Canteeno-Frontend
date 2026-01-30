import React, { useState, useContext } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { StoreContext } from "./context/StoreContext";

import Navbar from "./components/Navbar/Navbar";

import Footer from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import ChatWidget from "./components/ChatWidget/ChatWidget";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Home from "./pages/Home/Home";
import Cart from "./pages/cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import Verify from "./pages/Verify/Verify";
import MyOrders from "./pages/MyOrders/MyOrders";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import TrackOrder from "./pages/TrackOrder/TrackOrder";
import AdminPage from "./pages/AdminDashboard/AdminPage";
import AdminAnalytics from "./pages/AdminDashboard/AdminAnalytics";
import PWAInstallPrompt from "./components/PWAInstallerPrompt";

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const { userType, token } = useContext(StoreContext);

  const CustomerRoute = ({ children }) => {
    if (!token) {
      setShowLogin(true);
      return <Navigate to="/" replace />;
    }

    if (userType === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return children;
  };

  const AdminRoute = ({ children }) => {
    // Not logged in → open login modal and push to home
    if (!token) {
      setShowLogin(true);
      return <Navigate to="/" replace />;
    }
    // Non-admin trying to see admin pages → push to home
    if (userType !== "admin") {
      return <Navigate to="/" replace />;
    }
    return children;
  };
  // -------------------------------------------------------------------------

  return (
    <>
      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
      <Navbar setShowLogin={setShowLogin} />
      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
      <div className="app">
        <ToastContainer />

        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />

          {/* Customer-only */}
          <Route
            path="/cart"
            element={
              <CustomerRoute>
                <Cart />
              </CustomerRoute>
            }
          />
          <Route
            path="/order"
            element={
              <CustomerRoute>
                <PlaceOrder />
              </CustomerRoute>
            }
          />
          <Route
            path="/verify"
            element={
              <CustomerRoute>
                <Verify />
              </CustomerRoute>
            }
          />
          <Route
            path="/myorders"
            element={
              <CustomerRoute>
                <MyOrders />
              </CustomerRoute>
            }
          />
          <Route
            path="/track/:orderId"
            element={
              <CustomerRoute>
                <TrackOrder />
              </CustomerRoute>
            }
          />

          {/* Admin-only */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      '
      <PWAInstallPrompt />
      <Footer />
      <ChatWidget />
    </>
  );
};

export default App;
