import api from './api';

export const fetchEmiOptions = (amount) => {
  return api.get(`/emi?amount=${amount}`);
};

export const emiAdminService = {
  getAll: () => api.get('/emi'),
  create: (data) => api.post('/emi', data),
  update: (id, data) => api.put(`/emi/${id}`, data),
  delete: (id) => api.delete(`/emi/${id}`),
};
