import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './authentication/login';
import Register from './authentication/register';
import VerifyEmail from './authentication/VerifyEmail';
import ForgotPassword from './authentication/ForgotPassword';

//admin-view import
import AdminRegister from './authentication/adminregister';
import AdminLayout from './Admin-Frontend/Components/AdminLayout';
import MenuManagement from './Admin-Frontend/Pages/MenuManagement';
import Orders from './Admin-Frontend/Pages/Orders';
import Customers from './Admin-Frontend/Pages/Customers';
import Admins from './Admin-Frontend/Pages/Admins';
import AdminProfile from './Admin-Frontend/Pages/Profile';
import Dashboard from './Admin-Frontend/Pages/Dashboard';
import Reports from './Admin-Frontend/Pages/Reports';
import Settings from './Admin-Frontend/Pages/Settings';

//user-view import
import UserLayout from './User-Frontend/UserLayout.jsx';
import Intro from './User-Frontend/pages/intro.jsx';
import Home from './User-Frontend/pages/Home.jsx';
import Menu from './User-Frontend/pages/Menu.jsx';
import CategoryPage from './User-Frontend/pages/CategoryPage.jsx';
import Support from './User-Frontend/pages/Support.jsx';
import AboutUs from './User-Frontend/pages/AboutUs.jsx';
import Contact from './User-Frontend/pages/Contact.jsx';
import Policies from './User-Frontend/pages/Policies.jsx';
import Profile from './User-Frontend/pages/Profile.jsx';
import Cart from './User-Frontend/pages/Cart.jsx';
import Checkout from './User-Frontend/pages/Checkout.jsx';
import Billing from './User-Frontend/pages/Billing.jsx';
import OrderConfirmation from './User-Frontend/pages/OrderConfirmation.jsx';
import { CartProvider, useCart } from './User-Frontend/context.cart.jsx';
import Toast from './User-Frontend/components/Toast.jsx';

// Authentication
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastWrapper />
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/adminregister" element={<AdminRegister />} />

            {/* Admin Routes - Protected */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="menumanagement" element={<MenuManagement />} />
              <Route path="orders" element={<Orders />} />
              <Route path="customers" element={<Customers />} />
              <Route path="admins" element={<Admins />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* User Routes - Protected */}
            <Route path="/user" element={
              <ProtectedRoute requireUser={true}>
                <UserLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Intro />} />
              <Route path="intro" element={<Intro />} />
              <Route path="home" element={<Home />} />
              <Route path="menu" element={<Menu />} />
              <Route path="menu/:category" element={<CategoryPage />} />
              <Route path="support" element={<Support />} />
              <Route path="about-us" element={<AboutUs />} />
              <Route path="contact" element={<Contact />} />
              <Route path="policies" element={<Policies />} />
              <Route path="profile" element={<Profile />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="billing" element={<Billing />} />
              <Route path="order-confirmation" element={<OrderConfirmation />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
export default App;

function ToastWrapper() {
  const { toast } = useCart();
  return <Toast visible={toast.visible} message={toast.message} />;
}
