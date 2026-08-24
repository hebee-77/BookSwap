export type ExchangeRequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'RETURN_REQUESTED'
  | 'RETURN_ACCEPTED'
  | 'RETURN_DECLINED'
  | 'RETURN_IN_PROGRESS'
  | 'RETURNED'
  | 'COMPLETED';

export type ExchangeEventType =
  | 'EXCHANGE_CREATED'
  | 'EXCHANGE_ACCEPTED'
  | 'EXCHANGE_REJECTED'
  | 'RETURN_REQUESTED'
  | 'RETURN_ACCEPTED'
  | 'RETURN_DECLINED'
  | 'RETURN_STARTED'
  | 'BOOK_RETURNED'
  | 'OWNER_CONFIRMED'
  | 'EXCHANGE_COMPLETED';

export interface ExchangeRequest {
  id: number;
  requesterId: number;
  ownerId?: number;
  bookId: number;
  offeredBookId?: number | null;
  status: ExchangeRequestStatus;
  createdAt: string;
  returnRequestedAt?: string | null;
  returnAcceptedAt?: string | null;
  returnDeclinedAt?: string | null;
  returnStartedAt?: string | null;
  returnedAt?: string | null;
  confirmedAt?: string | null;
  returnMessage?: string | null;
}

export interface ExchangeRequestCreate {
  bookId: number;
  offeredBookId?: number | null;
}

export interface ReturnRequestCreate {
  message?: string;
}

export interface ExchangeHistoryItem {
  id: number;
  exchangeRequestId: number;
  actorId?: number;
  actorName?: string;
  actorEmail?: string;
  eventType: ExchangeEventType;
  createdAt: string;
  note?: string;
}

export interface ReturnDetailsResponse {
  exchangeId: number;
  status: ExchangeRequestStatus;
  bookId: number;
  bookTitle: string;
  bookAuthor: string;
  bookImageUrl?: string;
  offeredBookId?: number;
  offeredBookTitle?: string;
  offeredBookAuthor?: string;
  offeredBookImageUrl?: string;
  ownerId: number;
  ownerName: string;
  requesterId: number;
  requesterName: string;
  currentHolderId?: number;
  currentHolderName?: string;
  exchangeCreatedAt: string;
  returnRequestedAt?: string | null;
  returnAcceptedAt?: string | null;
  returnDeclinedAt?: string | null;
  returnStartedAt?: string | null;
  returnedAt?: string | null;
  confirmedAt?: string | null;
  returnMessage?: string | null;
  canRequestReturn: boolean;
  canAcceptReturn: boolean;
  canDeclineReturn: boolean;
  canMarkReturned: boolean;
  canConfirmReceived: boolean;
  history: ExchangeHistoryItem[];
}
