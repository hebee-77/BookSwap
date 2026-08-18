import api from './api';
import type { User } from '../types/user';

export const userService = {
  getUserById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },
};
