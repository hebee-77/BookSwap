export type ExchangeRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface ExchangeRequest {
  id: number;
  requesterId: number;
  ownerId?: number;
  bookId: number;
  offeredBookId?: number | null;
  status: ExchangeRequestStatus;
  createdAt: string;
}

export interface ExchangeRequestCreate {
  bookId: number;
  offeredBookId?: number | null;
}

