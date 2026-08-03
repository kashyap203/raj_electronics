import { Link, Outlet, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaBox, FaTags, FaShoppingBag, FaUsers, FaStar, FaSignOutAlt, FaTruck, FaMoneyBillWave, FaBars, FaTimes, FaImages } from 'react-icons/fa';
import { useAuth } from '../context/AppContext';
import { useState } from 'react';
import logo from '../assets/logo.png';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/admin', icon: FaTachometerAlt, label: 'Dashboard', exact: true },
    { to: '/admin/products', icon: FaBox, label: 'Products' },
    { to: '/admin/categories', icon: FaTags, label: 'Categories' },
    { to: '/admin/brands', icon: FaStar, label: 'Brands' },
    { to: '/admin/sliders', icon: FaImages, label: 'Hero Sliders' },
    { to: '/admin/orders', icon: FaShoppingBag, label: 'Orders' },
    { to: '/admin/users', icon: FaUsers, label: 'Users' },
    { to: '/admin/delivery-cities', icon: FaTruck, label: 'Free Delivery' },
    { to: '/admin/offers', icon: FaMoneyBillWave, label: 'Bank Offers' },
  ];

  const isActive = (link) =>
    link.exact ? location.pathname === link.to : location.pathname.startsWith(link.to);

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-700 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <img src={logo} alt="Raj Electronics" className="h-16 md:h-20 w-auto object-contain" />
          <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
        </div>
        <button className="lg:hidden text-gray-300 hover:text-white transition" onClick={() => setMobileOpen(false)}>
          <FaTimes size={24} />
        </button>
      </div>
      <nav className="p-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              isActive(link) ? 'bg-primary text-white font-semibold' : 'hover:bg-dark-light'
            }`}
          >
            <link.icon />
            {link.label}
          </Link>
        ))}
        <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-dark-light transition">
          View Store
        </Link>
        <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900/30 text-red-400 w-full transition mt-4">
          <FaSignOutAlt /> Logout
        </button>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-dark text-white shrink-0 hidden lg:flex flex-col overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setMobileOpen(false)}></div>
          <aside className="relative w-64 bg-dark text-white h-full flex flex-col overflow-y-auto shadow-2xl animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="bg-white shadow-sm px-4 py-4 flex items-center justify-between lg:hidden shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="text-gray-800 p-1 hover:text-primary transition">
              <FaBars size={22} />
            </button>
            <p className="font-bold">Admin Panel</p>
          </div>
          <p className="text-sm text-gray-500 font-medium">{user?.name}</p>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
