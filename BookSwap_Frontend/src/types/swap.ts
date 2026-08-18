export type ExchangeRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface ExchangeRequest {
  id: number;
  requesterId: number;
  bookId: number;
  status: ExchangeRequestStatus;
  createdAt: string;
}

export interface ExchangeRequestCreate {
  bookId: number;
}
