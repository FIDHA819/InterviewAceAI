import api from './api';
import type { CreateInterviewPayload } from '../types/interview.types';

export const interviewService = {
  generate: (payload: CreateInterviewPayload) =>
    api.post('/interviews/generate', payload),

  getAll: (page = 1) =>
    api.get(`/interviews?page=${page}&limit=10`),

  getById: (id: string) =>
    api.get(`/interviews/${id}`),

  delete: (id: string) =>
    api.delete(`/interviews/${id}`),
};