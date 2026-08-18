export interface Notification {
  id: number;
  userId: number;
  type: 'SWAP_REQUEST' | 'REQUEST_ACCEPTED' | 'REQUEST_REJECTED';
  message: string;
  read: boolean;
  createdAt: string;
  relatedEntityId?: number;
}
