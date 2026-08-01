import { Link, Outlet, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaBox, FaTags, FaShoppingBag, FaUsers, FaStar, FaSignOutAlt, FaTruck, FaMoneyBillWave } from 'react-icons/fa';
import { useAuth } from '../context/AppContext';
import logo from '../assets/logo.png';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/admin', icon: FaTachometerAlt, label: 'Dashboard', exact: true },
    { to: '/admin/products', icon: FaBox, label: 'Products' },
    { to: '/admin/categories', icon: FaTags, label: 'Categories' },
    { to: '/admin/brands', icon: FaStar, label: 'Brands' },
    { to: '/admin/orders', icon: FaShoppingBag, label: 'Orders' },
    { to: '/admin/users', icon: FaUsers, label: 'Users' },
    { to: '/admin/delivery-cities', icon: FaTruck, label: 'Free Delivery' },
    { to: '/admin/offers', icon: FaMoneyBillWave, label: 'Bank Offers' },
  ];

  const isActive = (link) =>
    link.exact ? location.pathname === link.to : location.pathname.startsWith(link.to);

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-dark text-white shrink-0 hidden lg:block">
        <div className="p-6 border-b border-gray-700">
          <div className="flex flex-col gap-1">
            <img src={logo} alt="Raj Electronics" className="h-16 md:h-20 w-auto object-contain" />
            <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
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
          <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900/30 text-red-400 w-full transition">
            <FaSignOutAlt /> Logout
          </button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between lg:hidden">
          <p className="font-bold">Admin Panel</p>
          <p className="text-sm text-gray-500">{user?.name}</p>
        </header>
        <div className="lg:hidden bg-dark text-white px-4 py--2 overflow-x-auto">
          <div className="flex gap-2 py-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  isActive(link) ? 'bg-primary text-white' : 'bg-dark-light'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
