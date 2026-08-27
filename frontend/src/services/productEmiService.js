import api from './api';

export const productEmiService = {
  getByProduct: (productId) => api.get(`/products/${productId}/emi-offers`),
  getEligible: (productId, amount) => api.get(`/products/${productId}/eligible-emis?amount=${amount}`),
  create: (productId, data) => api.post(`/products/${productId}/emi-offers`, data),
  createBatch: (productId, data) => api.post(`/products/${productId}/emi-offers/batch`, data),
  update: (offerId, data) => api.put(`/emi-offers/${offerId}`, data),
  delete: (offerId) => api.delete(`/emi-offers/${offerId}`),
  deleteByBank: (productId, bankName) => api.delete(`/products/${productId}/emi-offers/bank/${encodeURIComponent(bankName)}`),
};
