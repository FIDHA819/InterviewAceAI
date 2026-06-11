import api from './api';

export const sessionService = {
  start: (interviewId: string) =>
    api.post('/sessions/start', { interviewId }),

  saveAnswer: (sessionId: string, data: {
    questionId: string;
    text: string;
    timeSpent: number;
    currentQuestionIndex: number;
  }) => api.put(`/sessions/${sessionId}/answer`, data),

  complete: (sessionId: string, data: {
    answers: { questionId: string; text: string; timeSpent: number }[];
    totalTime: number;
  }) => api.put(`/sessions/${sessionId}/complete`, data),

  abandon: (sessionId: string) =>
    api.put(`/sessions/${sessionId}/abandon`),

  getById: (id: string) =>
    api.get(`/sessions/${id}`),

  getAll: () =>
    api.get('/sessions'),
};