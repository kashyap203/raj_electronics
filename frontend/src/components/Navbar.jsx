import { NavLink, useNavigate } from 'react-router-dom';
import { FaHeart, FaShoppingCart, FaSearch, FaUser, FaBars, FaTimes } from 'react-icons/fa';
import { useState } from 'react';
import { useAuth, useCart } from '../context/AppContext';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount, wishlistCount } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setSearchOpen(false);
      setMobileOpen(false);
    }
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Products' },
    { to: '/categories', label: 'Categories' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  const linkClass = ({ isActive }) =>
    `relative text-sm font-medium py-1 transition-colors ${
      isActive ? 'text-primary' : 'text-white hover:text-primary'
    } after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:bg-primary after:transition-all after:duration-300 ${
      isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
    }`;

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-dark/95 backdrop-blur-md text-white shadow-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between gap-4 h-20 md:h-24">
            {/* Logo */}
            <NavLink to="/" className="flex items-center shrink-0 py-1">
              <img
                src={logo}
                alt="Raj Electronics"
                className="h-16 sm:h-18 md:h-20 lg:h-22 w-auto max-h-20 md:max-h-22 object-contain transition-all hover:scale-105"
              />
            </NavLink>

            {/* Centered nav links - desktop only */}
            <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={linkClass} end={link.to === '/'}>
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Search toggle - desktop */}
              <div className="hidden md:flex items-center">
                {searchOpen ? (
                  <form onSubmit={handleSearch} className="flex items-center animate-fade-in">
                    <input
                      autoFocus
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onBlur={() => !search && setSearchOpen(false)}
                      placeholder="Search products, brands..."
                      className="w-56 px-3 py-1.5 rounded-l-full text-gray-800 text-sm outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-r-full transition"
                    >
                      <FaSearch size={14} />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="hover:text-primary transition"
                    aria-label="Open search"
                  >
                    <FaSearch size={18} />
                  </button>
                )}
              </div>

              <NavLink to="/wishlist" className="relative hover:text-primary transition">
                <FaHeart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </NavLink>

              <NavLink to="/cart" className="relative hover:text-primary transition">
                <FaShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </NavLink>

              {user ? (
                <div className="relative group">
                  <NavLink
                    to={user.role === 'admin' ? '/admin' : '/profile'}
                    className="flex items-center gap-1 hover:text-primary transition"
                  >
                    <FaUser size={18} />
                    <span className="hidden sm:inline text-sm">{user.name.split(' ')[0]}</span>
                  </NavLink>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all overflow-hidden">
                    {user.role === 'admin' ? (
                      <NavLink to="/admin" className="block px-4 py-2 hover:bg-gray-100">
                        Admin Panel
                      </NavLink>
                    ) : (
                      <>
                        <NavLink to="/profile" className="block px-4 py-2 hover:bg-gray-100">
                          My Profile
                        </NavLink>
                        <NavLink to="/profile/orders" className="block px-4 py-2 hover:bg-gray-100">
                          My Orders
                        </NavLink>
                      </>
                    )}
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  className="bg-primary hover:bg-primary-dark text-white font-semibold px-4 py-1.5 rounded-full transition text-sm"
                >
                  Login
                </NavLink>
              )}

              <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <FaBars size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 bg-dark-light text-white shadow-2xl p-5 flex flex-col gap-6 animate-slide-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">Menu</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <FaTimes size={22} />
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 px-3 py-2 rounded-full text-gray-800 text-sm outline-none"
              />
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded-full">
                <FaSearch size={14} />
              </button>
            </form>

            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `block py-2.5 px-3 rounded-lg transition ${
                        isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;