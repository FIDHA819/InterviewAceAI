import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authstore';
import { authService } from '../services/authService';
import type { LoginPayload, RegisterPayload } from '../types/auth.types';

export const useAuth = () => {
  const navigate = useNavigate();
  const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();

  const login = async (payload: LoginPayload) => {
    const { data } = await authService.login(payload);
    setAuth(data.data.user, data.data.accessToken);
    navigate('/dashboard');
  };

  const register = async (payload: RegisterPayload) => {
    const { data } = await authService.register(payload);
    setAuth(data.data.user, data.data.accessToken);
    navigate('/dashboard');
  };

  const logout = async () => {
    await authService.logout();
    clearAuth();
    navigate('/login');
  };

  return { login, register, logout, user, isAuthenticated };
};