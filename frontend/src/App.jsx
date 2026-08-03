import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, CartProvider } from './context/AppContext';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import InvoicePage from './pages/InvoicePage';
import CategoriesPage from './pages/CategoriesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import ProductsAdminPage from './pages/admin/ProductsAdminPage';
import CategoriesAdminPage from './pages/admin/CategoriesAdminPage';
import BrandsAdminPage from './pages/admin/BrandsAdminPage';
import OrdersAdminPage from './pages/admin/OrdersAdminPage';
import UsersAdminPage from './pages/admin/UsersAdminPage';
import AdminDeliveryCities from './pages/admin/AdminDeliveryCities';
import OffersAdminPage from './pages/admin/OffersAdminPage';
import AdminSliders from './pages/admin/AdminSliders';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Main Layout */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* Guest only */}
              <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

              {/* Protected user routes */}
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/profile/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="/profile/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            </Route>

            {/* Standalone Pages without Layout */}
            <Route path="/profile/orders/:id/invoice" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />

            {/* Admin Layout */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductsAdminPage />} />
              <Route path="categories" element={<CategoriesAdminPage />} />
              <Route path="brands" element={<BrandsAdminPage />} />
              <Route path="orders" element={<OrdersAdminPage />} />
              <Route path="users" element={<UsersAdminPage />} />
              <Route path="delivery-cities" element={<AdminDeliveryCities />} />
              <Route path="offers" element={<OffersAdminPage />} />
              <Route path="sliders" element={<AdminSliders />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
