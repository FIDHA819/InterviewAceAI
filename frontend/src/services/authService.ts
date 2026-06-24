import api from './api';
import type { LoginPayload, RegisterPayload, AuthResponse } from '../types/auth.types';

export const authService = {
  register: (data: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', data),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () =>
    api.get('/auth/me'),
  
updateProfile: (data: FormData) =>
  api.put('/users/profile', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/change-password', data),
};