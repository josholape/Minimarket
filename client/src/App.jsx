import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import AdminRoute from './components/AdminRoute.jsx';

import Home from './pages/Home.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Cart from './pages/Cart.jsx';
import Account from './pages/Account.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';

import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminProducts from './pages/AdminProducts.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import AdminCategories from './pages/AdminCategories.jsx';

function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <div className="flex-1">
        <Outlet />
      </div>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Customer-facing pages */}
      <Route element={<StoreLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products/:id" element={<ProductDetail />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route path="/cart" element={<Cart />} />
        <Route path="/account" element={<Account />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />

        <Route
          path="*"
          element={
            <main className="mx-auto max-w-6xl px-4 py-12">
              <h1 className="text-2xl font-bold">
                Page not found
              </h1>
            </main>
          }
        />
      </Route>

      {/* Admin-only pages */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route
          index
          element={<Navigate to="dashboard" replace />}
        />

        <Route
          path="dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="products"
          element={<AdminProducts />}
        />

        <Route
          path="orders"
          element={<AdminOrders />}
        />

        <Route
          path="categories"
          element={<AdminCategories />}
        />

        <Route
          path="*"
          element={<Navigate to="/admin/dashboard" replace />}
        />
      </Route>
    </Routes>
  );
}