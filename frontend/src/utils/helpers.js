const API_URL = import.meta.env.VITE_API_URL || '/api';

export const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/300x300?text=No+Image';
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : `/${path}`;
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export const getDiscountedPrice = (price, discount = 0) => {
  return Math.round(price - (price * discount) / 100);
};

export const calculateDiscount = (price, discount) => {
  return getDiscountedPrice(price, discount);
};

export default API_URL;
