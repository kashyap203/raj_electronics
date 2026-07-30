import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, cartService, wishlistService } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const { data } = await authService.login(credentials);
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const { data } = await authService.register(userData);
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = (data) => {
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [wishlist, setWishlist] = useState({ products: [] });

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [] });
      return;
    }
    try {
      const { data } = await cartService.get();
      setCart(data);
    } catch {
      setCart({ items: [] });
    }
  }, [user]);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist({ products: [] });
      return;
    }
    try {
      const { data } = await wishlistService.get();
      setWishlist(data);
    } catch {
      setWishlist({ products: [] });
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
    fetchWishlist();
  }, [fetchCart, fetchWishlist]);

  const addToCart = async (productId, quantity = 1) => {
    const { data } = await cartService.add(productId, quantity);
    setCart(data);
    return data;
  };

  const updateCartItem = async (productId, quantity) => {
    const { data } = await cartService.update(productId, quantity);
    setCart(data);
  };

  const removeFromCart = async (productId) => {
    const { data } = await cartService.remove(productId);
    setCart(data);
  };

  const applyOfferToCart = async (offerId) => {
    const { data } = await cartService.applyOffer(offerId);
    setCart(data);
    return data;
  };

  const addToWishlist = async (productId) => {
    const { data } = await wishlistService.add(productId);
    setWishlist(data);
  };

  const removeFromWishlist = async (productId) => {
    const { data } = await wishlistService.remove(productId);
    setWishlist(data);
  };

  const isInWishlist = (productId) =>
    wishlist.products?.some((p) => p._id === productId);

  const cartCount = cart.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const wishlistCount = wishlist.products?.length || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        cartCount,
        wishlistCount,
        addToCart,
        updateCartItem,
        removeFromCart,
        applyOfferToCart,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        fetchCart,
        fetchWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
