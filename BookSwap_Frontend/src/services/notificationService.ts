import api from './api';
import type { Notification } from '../types/notification';

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications');
    return response.data;
  },

  markAsRead: async (id: number): Promise<Notification> => {
    const response = await api.put<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },

  deleteNotification: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
