import api from './api';
import type { ExchangeRequest, ExchangeRequestCreate } from '../types/swap';

export const swapService = {
  createRequest: async (request: ExchangeRequestCreate): Promise<ExchangeRequest> => {
    const response = await api.post<ExchangeRequest>('/exchange-requests', request);
    return response.data;
  },

  getRequestById: async (id: number): Promise<ExchangeRequest> => {
    const response = await api.get<ExchangeRequest>(`/exchange-requests/${id}`);
    return response.data;
  },

  getAllRequests: async (): Promise<ExchangeRequest[]> => {
    const response = await api.get<ExchangeRequest[]>('/exchange-requests');
    return response.data;
  },

  getRequestsByRequester: async (requesterId: number): Promise<ExchangeRequest[]> => {
    const response = await api.get<ExchangeRequest[]>(`/exchange-requests/requester/${requesterId}`);
    return response.data;
  },

  getRequestsByBook: async (bookId: number): Promise<ExchangeRequest[]> => {
    const response = await api.get<ExchangeRequest[]>(`/exchange-requests/book/${bookId}`);
    return response.data;
  },

  acceptRequest: async (id: number): Promise<ExchangeRequest> => {
    const response = await api.put<ExchangeRequest>(`/exchange-requests/${id}/accept`);
    return response.data;
  },

  rejectRequest: async (id: number): Promise<ExchangeRequest> => {
    const response = await api.put<ExchangeRequest>(`/exchange-requests/${id}/reject`);
    return response.data;
  },
};
