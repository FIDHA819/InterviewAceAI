import api from './api';

export const feedbackService = {
  generate: (sessionId: string) =>
    api.post('/feedback/generate', { sessionId }),

  getBySession: (sessionId: string) =>
    api.get(`/feedback/${sessionId}`),

  getAll: () =>
    api.get('/feedback'),
};