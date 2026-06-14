import api from './api';

export const analyticsService = {
  getOverview: () => api.get('/analytics/overview'),
  getHistory:  (page = 1) => api.get(`/analytics/history?page=${page}&limit=8`),
};