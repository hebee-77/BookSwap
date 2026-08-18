import api from './api';
import type { User, LoginResponse } from '../types/auth';

const TOKEN_KEY = 'token';

export const authService = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    const response = await api.post<User>('/users', { name, email, password });
    return response.data;
  },

  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },
};
