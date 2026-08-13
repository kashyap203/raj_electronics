import { NavLink, useNavigate } from 'react-router-dom';
import { FaHeart, FaShoppingCart, FaSearch, FaUser, FaBars, FaTimes } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useAuth, useCart } from '../context/AppContext';
import { productService } from '../services';
import logo from '../assets/logo.png';
import { getImageUrl } from '../utils/helpers.js';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount, wishlistCount } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (search.trim().length > 1) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        productService.getAll({ search: search.trim() })
          .then(res => {
            setSearchResults((res.data.products || []).slice(0, 4));
          })
          .catch(err => console.error(err))
          .finally(() => setIsSearching(false));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [search]);

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
    `relative text-sm font-medium py-1 transition-colors ${isActive ? 'text-primary' : 'text-white hover:text-primary'
    } after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:bg-primary after:transition-all after:duration-300 ${isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
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
                <button
                  onClick={() => setSearchOpen(true)}
                  className="hover:text-primary transition"
                  aria-label="Open search"
                >
                  <FaSearch size={20} />
                </button>
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

            <form onSubmit={handleSearch} className="flex items-stretch">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 px-4 py-2 rounded-l-full bg-white text-gray-800 text-sm outline-none border-none"
              />
              <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-4 flex items-center justify-center rounded-r-full transition">
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
                      `block py-2.5 px-3 rounded-lg transition ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}

              {user && (
                <>
                  <li className="my-2 border-t border-white/10"></li>
                  {user.role === 'admin' ? (
                    <li>
                      <NavLink
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `block py-2.5 px-3 rounded-lg transition ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'
                          }`
                        }
                      >
                        Admin Panel
                      </NavLink>
                    </li>
                  ) : (
                    <>
                      <li>
                        <NavLink
                          to="/profile"
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            `block py-2.5 px-3 rounded-lg transition ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'
                            }`
                          }
                        >
                          My Profile
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/profile/orders"
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            `block py-2.5 px-3 rounded-lg transition ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'
                            }`
                          }
                        >
                          My Orders
                        </NavLink>
                      </li>
                    </>
                  )}
                  <li>
                    <button
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="block w-full text-left py-2.5 px-3 rounded-lg transition hover:bg-white/5 text-red-500"
                    >
                      Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-4xl animate-slide-up relative flex flex-col items-center">
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute -top-16 right-0 text-gray-300 hover:text-white transition cursor-pointer p-2"
            >
              <FaTimes size={24} />
            </button>

            <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-8 drop-shadow-md">
              What are you looking for?
            </h2>
            <form onSubmit={handleSearch} className="relative w-full z-10">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for TVs, ACs, Laptops..."
                className="w-full bg-white text-gray-900 text-xl px-6 py-4 md:py-5 rounded-2xl outline-none shadow-xl pl-14 pr-32"
              />
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 md:py-3 rounded-xl font-bold transition shadow-md"
              >
                Search
              </button>
            </form>

            {/* Live Search Results */}
            {search.trim().length > 1 && (
              <div className="mt-4 bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in max-h-[400px] overflow-y-auto">
                {isSearching ? (
                  <div className="p-6 text-center text-gray-500 font-medium">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div className="flex flex-col divide-y divide-gray-100">
                    {searchResults.map(product => (
                      <div
                        key={product._id}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearch('');
                          navigate(`/product/${product._id}`);
                        }}
                        className="flex items-center gap-4 p-4 hover:bg-blue-50 cursor-pointer transition"
                      >
                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                          {product.images && product.images[0] ? (
                            <img src={getImageUrl(product.images[0])} alt={product.name} className="max-w-full max-h-full object-contain p-1" />
                          ) : (
                            <FaSearch className="text-gray-300" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 line-clamp-1">{product.name}</h4>
                          <p className="text-sm font-semibold text-primary mt-1">₹{product.price}</p>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={handleSearch}
                      className="w-full p-4 text-center text-primary font-bold hover:bg-blue-50 transition text-sm uppercase tracking-wide"
                    >
                      View all results
                    </button>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500 font-medium">No products found for "{search}"</div>
                )}
              </div>
            )}

            {!search.trim() && (
              <div className="mt-10 flex flex-col items-center">
                <p className="text-gray-400 text-sm mb-3 font-medium uppercase tracking-wider">Popular Searches</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {['Smart TV', 'Air Conditioner', 'Refrigerator'].map(term => (
                    <button
                      key={term}
                      onClick={(e) => { e.preventDefault(); setSearch(term); handleSearch(e); }}
                      className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-primary text-white border border-white/10 hover:border-primary transition-all duration-300 text-sm font-medium backdrop-blur-md cursor-pointer shadow-sm hover:shadow-primary/20"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;