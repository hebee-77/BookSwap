import { Client } from '@stomp/stompjs';
import type { Message, MessageReceiptEvent, PresenceEvent, SendMessageRequest, TypingEvent } from '../../types/chat';

type MessageCallback = (message: Message) => void;
type ReceiptCallback = (receipt: MessageReceiptEvent) => void;
type TypingCallback = (typing: TypingEvent) => void;
type PresenceCallback = (presence: PresenceEvent) => void;
type StatusCallback = (connected: boolean) => void;

class ChatSocketService {
  private client: Client | null = null;
  private isConnected = false;
  private messageCallbacks: Set<MessageCallback> = new Set();
  private receiptCallbacks: Set<ReceiptCallback> = new Set();
  private typingCallbacks: Set<TypingCallback> = new Set();
  private presenceCallbacks: Set<PresenceCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();

  public connect(token: string) {
    if (this.client && this.isConnected) {
      return;
    }

    if (this.client) {
      this.client.deactivate();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    this.client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {
        // quiet in production
      },
      onConnect: () => {
        this.isConnected = true;
        this.notifyStatus(true);

        // 1. Subscribe to User messages
        this.client?.subscribe('/user/queue/messages', (stompMessage) => {
          try {
            const message: Message = JSON.parse(stompMessage.body);
            this.messageCallbacks.forEach((cb) => cb(message));
          } catch (err) {
            console.error('Failed to parse incoming message:', err);
          }
        });

        // 2. Subscribe to User receipts
        this.client?.subscribe('/user/queue/receipts', (stompMessage) => {
          try {
            const receipt: MessageReceiptEvent = JSON.parse(stompMessage.body);
            this.receiptCallbacks.forEach((cb) => cb(receipt));
          } catch (err) {
            console.error('Failed to parse incoming receipt:', err);
          }
        });

        // 3. Subscribe to User typing events
        this.client?.subscribe('/user/queue/typing', (stompMessage) => {
          try {
            const typing: TypingEvent = JSON.parse(stompMessage.body);
            this.typingCallbacks.forEach((cb) => cb(typing));
          } catch (err) {
            console.error('Failed to parse incoming typing event:', err);
          }
        });

        // 4. Subscribe to Presence topic
        this.client?.subscribe('/topic/presence', (stompMessage) => {
          try {
            const presence: PresenceEvent = JSON.parse(stompMessage.body);
            this.presenceCallbacks.forEach((cb) => cb(presence));
          } catch (err) {
            console.error('Failed to parse incoming presence event:', err);
          }
        });
      },
      onDisconnect: () => {
        this.isConnected = false;
        this.notifyStatus(false);
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
        this.isConnected = false;
        this.notifyStatus(false);
      },
      onWebSocketClose: () => {
        this.isConnected = false;
        this.notifyStatus(false);
      },
    });

    this.client.activate();
  }

  public disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.isConnected = false;
    this.notifyStatus(false);
  }

  public sendMessage(req: SendMessageRequest) {
    if (!this.client || !this.isConnected) {
      return false;
    }
    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(req),
    });
    return true;
  }

  public sendTyping(conversationId: number, isTyping: boolean) {
    if (!this.client || !this.isConnected) {
      return;
    }
    this.client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ conversationId, typing: isTyping }),
    });
  }

  public sendRead(conversationId: number) {
    if (!this.client || !this.isConnected) {
      return;
    }
    this.client.publish({
      destination: '/app/chat.read',
      body: JSON.stringify({ conversationId }),
    });
  }

  public subscribeMessage(cb: MessageCallback): () => void {
    this.messageCallbacks.add(cb);
    return () => this.messageCallbacks.delete(cb);
  }

  public subscribeReceipt(cb: ReceiptCallback): () => void {
    this.receiptCallbacks.add(cb);
    return () => this.receiptCallbacks.delete(cb);
  }

  public subscribeTyping(cb: TypingCallback): () => void {
    this.typingCallbacks.add(cb);
    return () => this.typingCallbacks.delete(cb);
  }

  public subscribePresence(cb: PresenceCallback): () => void {
    this.presenceCallbacks.add(cb);
    return () => this.presenceCallbacks.delete(cb);
  }

  public subscribeStatus(cb: StatusCallback): () => void {
    this.statusCallbacks.add(cb);
    cb(this.isConnected);
    return () => this.statusCallbacks.delete(cb);
  }

  private notifyStatus(connected: boolean) {
    this.statusCallbacks.forEach((cb) => cb(connected));
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}

export const chatSocket = new ChatSocketService();
