import React, { useEffect, useRef } from 'react';
import type { Message } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { Button } from '../ui/button';
import { Loader2, MessageSquareDashed } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onReply: (message: Message) => void;
  onDelete: (messageId: number) => void;
  onImageClick: (url: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  isLoading,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onReply,
  onDelete,
  onImageClick,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on initial load or new messages
  useEffect(() => {
    if (!isLoadingMore) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoadingMore]);

  const formatDateLabel = (isoDate: string) => {
    try {
      const msgDate = new Date(isoDate);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (msgDate.toDateString() === today.toDateString()) {
        return 'Today';
      }
      if (msgDate.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      return msgDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return '';
    }
  };

  // Group messages by date
  const groupedMessages: { dateLabel: string; items: Message[] }[] = [];
  let currentDateLabel = '';
  let currentGroup: Message[] = [];

  messages.forEach((msg) => {
    const label = formatDateLabel(msg.createdAt);
    if (label !== currentDateLabel) {
      if (currentGroup.length > 0) {
        groupedMessages.push({ dateLabel: currentDateLabel, items: currentGroup });
      }
      currentDateLabel = label;
      currentGroup = [msg];
    } else {
      currentGroup.push(msg);
    }
  });

  if (currentGroup.length > 0) {
    groupedMessages.push({ dateLabel: currentDateLabel, items: currentGroup });
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center gap-3 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading conversation history...
        </p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center text-center p-8">
        <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <MessageSquareDashed className="h-8 w-8" />
        </div>
        <h3 className="text-base font-bold text-foreground">No messages yet</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
          Say hello and start discussing your book exchange!
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 select-text overscroll-contain"
    >
      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="text-xs font-semibold h-7 rounded-full shadow-2xs"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Loading older messages...
              </>
            ) : (
              'Load earlier messages'
            )}
          </Button>
        </div>
      )}

      {/* Grouped Messages with Date Separators */}
      {groupedMessages.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-1">
          {/* Date Separator Pill */}
          <div className="flex justify-center my-3">
            <span className="rounded-full bg-muted/80 backdrop-blur border border-border/60 px-3 py-0.5 text-[11px] font-semibold text-muted-foreground shadow-2xs select-none">
              {group.dateLabel}
            </span>
          </div>

          {/* Messages in Group */}
          {group.items.map((msg) => {
            const isSelf = msg.sender?.id === currentUserId;
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isSelf={isSelf}
                onReply={onReply}
                onDelete={onDelete}
                onImageClick={onImageClick}
              />
            );
          })}
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
};
