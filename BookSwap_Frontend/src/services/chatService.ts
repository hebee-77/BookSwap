import api from './api';
import type {
  Conversation,
  CreateConversationRequest,
  Message,
  MessageAttachment,
  MessagePage,
  SendMessageRequest,
} from '../types/chat';

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get<Conversation[]>('/conversations');
    return response.data;
  },

  async createOrGetConversation(request: CreateConversationRequest): Promise<Conversation> {
    const response = await api.post<Conversation>('/conversations', request);
    return response.data;
  },

  async getConversationById(id: number): Promise<Conversation> {
    const response = await api.get<Conversation>(`/conversations/${id}`);
    return response.data;
  },

  async getMessages(conversationId: number, page = 0, size = 30): Promise<MessagePage> {
    const response = await api.get<MessagePage>(`/conversations/${conversationId}/messages`, {
      params: { page, size },
    });
    return response.data;
  },

  async sendMessage(conversationId: number, request: SendMessageRequest): Promise<Message> {
    const response = await api.post<Message>(`/conversations/${conversationId}/messages`, request);
    return response.data;
  },

  async markAsRead(conversationId: number): Promise<void> {
    await api.post(`/conversations/${conversationId}/read`);
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/conversations/unread-count');
    return response.data;
  },

  async deleteMessage(conversationId: number, messageId: number): Promise<void> {
    await api.delete(`/conversations/${conversationId}/messages/${messageId}`);
  },

  async uploadAttachment(file: File): Promise<MessageAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<MessageAttachment>('/conversations/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
