import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
import { chatSocket } from '../services/websocket/chatSocket';
import { ConversationList } from '../components/chat/ConversationList';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ExchangeBanner } from '../components/chat/ExchangeBanner';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { EmptyChatState } from '../components/chat/EmptyChatState';
import { ImageLightbox } from '../components/chat/ImageLightbox';
import type { Message, SendMessageRequest, TypingEvent, PresenceEvent, MessageReceiptEvent } from '../types/chat';

export const ChatPage: React.FC = () => {
  const { conversationId: paramId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, token } = useAuth();

  const activeId = paramId ? Number(paramId) : null;
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 1. Fetch Conversations List
  const {
    data: conversations = [],
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(),
    enabled: !!user?.id,
  });

  // 2. Fetch Active Conversation Details
  const { data: activeConversation } = useQuery({
    queryKey: ['conversation', activeId],
    queryFn: () => (activeId ? chatService.getConversationById(activeId) : null),
    enabled: !!activeId,
  });

  // 3. Load Initial Messages for Active Conversation
  const { isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', activeId],
    queryFn: async () => {
      if (!activeId) return null;
      const data = await chatService.getMessages(activeId, 0, 30);
      setMessages([...data.content].reverse());
      setCurrentPage(0);
      setHasMore(!data.last);
      // Mark conversation as read on load
      chatService.markAsRead(activeId);
      chatSocket.sendRead(activeId);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
      return data;
    },
    enabled: !!activeId,
  });

  // Load More Older Messages
  const handleLoadMore = async () => {
    if (!activeId || !hasMore || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const data = await chatService.getMessages(activeId, nextPage, 30);
      const olderMessages = [...data.content].reverse();
      setMessages((prev) => [...olderMessages, ...prev]);
      setCurrentPage(nextPage);
      setHasMore(!data.last);
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 4. WebSocket Lifecycle and Event Subscriptions
  useEffect(() => {
    if (token) {
      chatSocket.connect(token);
    }

    // Message handler
    const unsubMsg = chatSocket.subscribeMessage((newMsg: Message) => {
      // Invalidate conversations list so sidebar updates latest message & unread badge
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });

      // If message is for currently open conversation
      if (activeId && newMsg.conversationId === activeId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === newMsg.id);
          if (exists) {
            return prev.map((m) => (m.id === newMsg.id ? newMsg : m));
          }
          return [...prev, newMsg];
        });

        // Mark as read if received from partner while chat is active
        if (newMsg.sender?.id !== user?.id) {
          chatService.markAsRead(activeId);
          chatSocket.sendRead(activeId);
        }
      }
    });

    // Receipt handler (status update: SENT -> DELIVERED -> READ)
    const unsubReceipt = chatSocket.subscribeReceipt((receipt: MessageReceiptEvent) => {
      if (activeId && receipt.conversationId === activeId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.sender?.id === user?.id && m.id <= receipt.messageId) {
              return { ...m, status: receipt.status };
            }
            return m;
          })
        );
      }
    });

    // Typing handler
    const unsubTyping = chatSocket.subscribeTyping((typingEvent: TypingEvent) => {
      if (activeId && typingEvent.conversationId === activeId && typingEvent.userId !== user?.id) {
        setIsPartnerTyping(typingEvent.typing);
        if (typingEvent.typing) {
          if (typingTimeout) clearTimeout(typingTimeout);
          const t = setTimeout(() => setIsPartnerTyping(false), 3000);
          setTypingTimeout(t);
        }
      }
    });

    // Presence handler
    const unsubPresence = chatSocket.subscribePresence((_presence: PresenceEvent) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (activeId) {
        queryClient.invalidateQueries({ queryKey: ['conversation', activeId] });
      }
    });

    return () => {
      unsubMsg();
      unsubReceipt();
      unsubTyping();
      unsubPresence();
    };
  }, [token, activeId, user?.id, queryClient]);

  // Handle Send Message
  const handleSendMessage = useCallback(
    async (req: SendMessageRequest) => {
      if (!activeId) return;

      try {
        // First try WebSocket real-time delivery
        const sentViaWs = chatSocket.sendMessage(req);
        if (!sentViaWs) {
          // Fallback to REST API if socket not ready
          const res = await chatService.sendMessage(activeId, req);
          setMessages((prev) => [...prev, res]);
        }
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to send message');
      }
    },
    [activeId, queryClient]
  );

  // Handle Typing Notification
  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (activeId) {
        chatSocket.sendTyping(activeId, isTyping);
      }
    },
    [activeId]
  );

  // Handle Message Deletion
  const handleDeleteMessage = async (messageId: number) => {
    if (!activeId) return;
    try {
      await chatService.deleteMessage(activeId, messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, deleted: true, content: 'This message was deleted', attachments: [] }
            : m
        )
      );
      toast.success('Message deleted');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete message');
    }
  };

  const handleSelectConversation = (id: number) => {
    setReplyTo(null);
    setIsPartnerTyping(false);
    navigate(`/chat/${id}`);
  };

  const handleBackToList = () => {
    navigate('/chat');
  };

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8 py-4 h-[calc(100vh-5rem)]">
      <div className="h-full rounded-2xl border border-border bg-card shadow-lg overflow-hidden flex flex-col md:flex-row">
        {/* Left Column: Conversation Sidebar */}
        <div
          className={`w-full md:w-80 lg:w-96 h-full shrink-0 ${
            activeId ? 'hidden md:block' : 'block'
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={handleSelectConversation}
            isLoading={isLoadingConversations}
          />
        </div>

        {/* Right Column: Chat Room Window or Empty State */}
        {activeId && activeConversation ? (
          <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
            {/* 1. Header */}
            <ChatHeader
              participant={activeConversation.participant}
              isOnline={activeConversation.online}
              isTyping={isPartnerTyping}
              onBack={handleBackToList}
              showBackButton={true}
            />

            {/* 2. Exchange Banner (if conversation has swap context) */}
            {activeConversation.exchange && (
              <ExchangeBanner
                exchange={activeConversation.exchange}
                onStatusUpdated={() => {
                  refetchConversations();
                  queryClient.invalidateQueries({ queryKey: ['conversation', activeId] });
                }}
              />
            )}

            {/* 3. Messages Stream */}
            <MessageList
              messages={messages}
              currentUserId={user?.id || 0}
              isLoading={isLoadingMessages && messages.length === 0}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={handleLoadMore}
              onReply={(m) => setReplyTo(m)}
              onDelete={handleDeleteMessage}
              onImageClick={(url) => setLightboxUrl(url)}
            />

            {/* 4. Composer Input */}
            <MessageInput
              conversationId={activeId}
              replyTo={replyTo}
              onClearReply={() => setReplyTo(null)}
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
            />
          </div>
        ) : (
          <EmptyChatState />
        )}
      </div>

      {/* Lightbox Preview Modal */}
      <ImageLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
};

export default ChatPage;
