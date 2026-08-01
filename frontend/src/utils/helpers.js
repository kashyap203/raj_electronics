const API_URL = import.meta.env.VITE_API_URL || '/api';
const BACKEND_BASE = API_URL.startsWith('http') ? API_URL.replace(/\/api\/?$/, '') : '';

export const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/300x300?text=No+Image';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return BACKEND_BASE ? `${BACKEND_BASE}${cleanPath}` : cleanPath;
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price || 0);
};

export const getDiscountedPrice = (price, discount = 0) => {
  return Math.round((price || 0) - ((price || 0) * (discount || 0)) / 100);
};

export const calculateDiscount = (price, discount) => {
  return getDiscountedPrice(price, discount);
};

export default API_URL;

