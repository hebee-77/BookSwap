export type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface UserSummary {
  id: number;
  name: string;
  email: string;
}

export interface ExchangeContext {
  id: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  bookId: number;
  bookTitle: string;
  bookAuthor: string;
  bookImageUrl?: string;
  bookCondition?: string;
  requesterId: number;
  requesterName: string;
  ownerId: number;
  ownerName: string;
}

export interface MessageAttachment {
  id?: number;
  fileUrl: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt?: string;
}

export interface MessageReply {
  id: number;
  senderId?: number;
  senderName?: string;
  content: string;
  messageType: MessageType;
  createdAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  sender: UserSummary | null;
  content: string;
  messageType: MessageType;
  status: MessageStatus;
  replyTo?: MessageReply | null;
  attachments?: MessageAttachment[];
  deleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MessagePage {
  content: Message[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface Conversation {
  id: number;
  participant: UserSummary;
  lastMessage?: Message | null;
  unreadCount: number;
  online: boolean;
  exchange?: ExchangeContext | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationRequest {
  userId: number;
  exchangeRequestId?: number;
}

export interface SendMessageRequest {
  conversationId: number;
  content?: string;
  messageType?: MessageType;
  replyToMessageId?: number;
  attachmentUrls?: string[];
}

export interface TypingEvent {
  conversationId: number;
  userId: number;
  userName: string;
  typing: boolean;
}

export interface PresenceEvent {
  userId: number;
  online: boolean;
  timestamp: string;
}

export interface MessageReceiptEvent {
  conversationId: number;
  messageId: number;
  userId: number;
  status: MessageStatus;
  timestamp: string;
}
