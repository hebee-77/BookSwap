import api from './api';
import type {
  ExchangeRequest,
  ExchangeRequestCreate,
  ReturnRequestCreate,
  ReturnDetailsResponse,
  ExchangeHistoryItem,
  ReturnOtpGenerateResponse,
  ReturnOtpVerifyRequest,
} from '../types/swap';

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

  getMyRequests: async (): Promise<ExchangeRequest[]> => {
    const response = await api.get<ExchangeRequest[]>('/exchange-requests/my');
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

  // ==========================================
  // RETURN WORKFLOW APIS
  // ==========================================

  requestReturn: async (id: number, request?: ReturnRequestCreate): Promise<ReturnDetailsResponse> => {
    const response = await api.post<ReturnDetailsResponse>(`/exchange-requests/${id}/return-request`, request || {});
    return response.data;
  },

  acceptReturn: async (id: number): Promise<ReturnDetailsResponse> => {
    const response = await api.post<ReturnDetailsResponse>(`/exchange-requests/${id}/return-request/accept`);
    return response.data;
  },

  declineReturn: async (id: number, request?: ReturnRequestCreate): Promise<ReturnDetailsResponse> => {
    const response = await api.post<ReturnDetailsResponse>(`/exchange-requests/${id}/return-request/decline`, request || {});
    return response.data;
  },

  generateReturnOtp: async (id: number): Promise<ReturnOtpGenerateResponse> => {
    const response = await api.post<ReturnOtpGenerateResponse>(`/exchange-requests/${id}/return/otp/generate`);
    return response.data;
  },

  verifyReturnOtp: async (id: number, otp: string): Promise<ReturnDetailsResponse> => {
    const request: ReturnOtpVerifyRequest = { otp };
    const response = await api.post<ReturnDetailsResponse>(`/exchange-requests/${id}/return/otp/verify`, request);
    return response.data;
  },

  confirmReceived: async (id: number): Promise<ReturnDetailsResponse> => {
    const response = await api.post<ReturnDetailsResponse>(`/exchange-requests/${id}/return/confirm`);
    return response.data;
  },

  getReturnDetails: async (id: number): Promise<ReturnDetailsResponse> => {
    const response = await api.get<ReturnDetailsResponse>(`/exchange-requests/${id}/return`);
    return response.data;
  },

  getExchangeHistory: async (id: number): Promise<ExchangeHistoryItem[]> => {
    const response = await api.get<ExchangeHistoryItem[]>(`/exchange-requests/${id}/history`);
    return response.data;
  },
};
