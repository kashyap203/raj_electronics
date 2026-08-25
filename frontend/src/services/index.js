import api from './api.js';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  addAddress: (data) => api.post('/auth/addresses', data),
  updateAddress: (id, data) => api.put(`/auth/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/auth/addresses/${id}`),
};

export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getBySlug: (slug) => api.get(`/products/slug/${slug}`),
  getRelated: (id) => api.get(`/products/${id}/related`),
  create: (data) => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/products/${id}`),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
  getSerialNumbers: (id) => api.get(`/products/${id}/serial-numbers`),
  addSerialNumber: (id, data) => api.post(`/products/${id}/serial-numbers`, data),
  updateSerialNumber: (id, snId, data) => api.put(`/products/${id}/serial-numbers/${snId}`, data),
  deleteSerialNumber: (id, snId) => api.delete(`/products/${id}/serial-numbers/${snId}`),
  getAvailableOffers: (id) => api.get(`/products/${id}/available-offers`),
  getBankDiscounts: (id) => api.get(`/products/${id}/bank-discounts`),
  addBankDiscount: (id, data) => api.post(`/products/${id}/bank-discounts`, data),
  updateBankDiscount: (id, discountId, data) => api.put(`/products/${id}/bank-discounts/${discountId}`, data),
  deleteBankDiscount: (id, discountId) => api.delete(`/products/${id}/bank-discounts/${discountId}`),
};

export const categoryService = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/categories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const brandService = {
  getAll: () => api.get('/brands'),
  getById: (id) => api.get(`/brands/${id}`),
  create: (data) => api.post('/brands', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/brands/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/brands/${id}`),
};

export const cartService = {
  get: () => api.get('/cart'),
  add: (productId, quantity = 1, offerId, bankDiscountId) => api.post('/cart', { productId, quantity, offerId, bankDiscountId }),
  update: (productId, quantity) => api.put(`/cart/${productId}`, { quantity }),
  remove: (productId) => api.delete(`/cart/${productId}`),
  clear: () => api.delete('/cart'),
  applyOffer: (offerId) => api.put('/cart/offer', { offerId }),
  applyBankDiscount: (productId, discountId) => api.put('/cart/bank-discount', { productId, discountId }),
};

export const wishlistService = {
  get: () => api.get('/wishlist'),
  add: (productId) => api.post('/wishlist', { productId }),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

export const orderService = {
  create: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my'),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
  getAll: (params) => api.get('/orders', { params }),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  getSalesSummary: () => api.get('/orders/sales-summary'),
};

export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  block: (id) => api.put(`/users/${id}/block`),
  delete: (id) => api.delete(`/users/${id}`),
};

export const deliveryCityService = {
  getAll: () => api.get('/delivery-cities'),
  add: (data) => api.post('/delivery-cities', data),
  delete: (id) => api.delete(`/delivery-cities/${id}`),
};

export const paymentService = {
  createRazorpayOrder: (orderId) => api.post('/payment/create-order', { orderId }),
  verifyPayment: (data) => api.post('/payment/verify-payment', data),
  handleFailure: (data) => api.post('/payment/payment-failed', data),

  // ICICI Gateway endpoints
  initiateICICIPayment: (orderId) => api.post('/payment/icici/initiate', { orderId }),
  initiateICICIDirectPayment: (data) => api.post('/payment/icici/initiate', data),
  getCardBin: (cardNo) => api.post('/payment/icici/bin', { cardNo }),
  validatePaymentAndOffer: (data) => api.post('/payment/icici/validate-payment-offer', data),
  generateOTP: (generateOTPURI, tranCtx) => api.get('/payment/icici/otp/generate', { params: { generateOTPURI, tranCtx } }),
  verifyOTP: (verifyOTPURI, tranCtx, otp) => api.post('/payment/icici/otp/verify', { verifyOTPURI, tranCtx, otp }),
  authorizePayment: (authorizeURI, tranCtx) => api.post('/payment/icici/authorize', { authorizeURI, tranCtx }),
  checkICICIPaymentStatus: (orderId) => api.post('/payment/icici/status', { orderId }),
  generateICICIQR: (orderId) => api.post('/payment/icici/qr', { orderId }),
};

export const offerService = {
  getActive: () => api.get('/offers'),
  getAll: () => api.get('/offers/all'),
  create: (data) => api.post('/offers', data),
  update: (id, data) => api.put(`/offers/${id}`, data),
  delete: (id) => api.delete(`/offers/${id}`),
  getOfferSerialNumbers: (id) => api.get(`/offers/${id}/serial-numbers`),
  assignSerialNumbers: (id, data) => api.post(`/offers/${id}/serial-numbers`, data),
  removeSerialNumberFromOffer: (id, snId) => api.delete(`/offers/${id}/serial-numbers/${snId}`),
};

export const sliderService = {
  getAll: () => api.get('/sliders'),
  getAdminAll: () => api.get('/sliders/admin'),
  getById: (id) => api.get(`/sliders/${id}`),
  create: (data) => api.post('/sliders', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/sliders/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/sliders/${id}`),
};
