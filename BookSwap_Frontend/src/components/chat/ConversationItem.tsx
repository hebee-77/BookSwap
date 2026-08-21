import React from 'react';
import { OnlineIndicator } from './OnlineIndicator';
import { BookOpen, Image as ImageIcon } from 'lucide-react';
import type { Conversation } from '../../types/chat';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  const { participant, lastMessage, unreadCount, online, exchange } = conversation;
  const initial = participant.name ? participant.name.charAt(0).toUpperCase() : 'U';

  const formatTimestamp = (isoDate?: string) => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (diffHours < 48) return 'Yesterday';
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const renderLastMessageSnippet = () => {
    if (!lastMessage) {
      return <span className="italic text-muted-foreground/70">No messages yet</span>;
    }
    if (lastMessage.deleted) {
      return <span className="italic text-muted-foreground/70">Message deleted</span>;
    }
    if (lastMessage.messageType === 'IMAGE') {
      return (
        <span className="flex items-center gap-1">
          <ImageIcon className="h-3 w-3" />
          <span>Photo</span>
        </span>
      );
    }
    return lastMessage.content;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition-all duration-150 flex items-center gap-3 relative cursor-pointer ${
        isActive
          ? 'bg-primary/10 border border-primary/20 shadow-2xs'
          : 'hover:bg-muted/60 border border-transparent'
      }`}
    >
      {/* Avatar with Presence Dot */}
      <div className="relative shrink-0">
        <div
          className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm select-none transition-colors ${
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/10 text-primary border border-primary/20'
          }`}
        >
          {initial}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5">
          <OnlineIndicator online={online} size="sm" />
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <h4 className="text-sm font-bold text-foreground truncate">{participant.name}</h4>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {formatTimestamp(lastMessage?.createdAt || conversation.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-xs truncate ${
              unreadCount > 0
                ? 'font-bold text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            {renderLastMessageSnippet()}
          </p>

          {/* Unread Message Badge */}
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-4.5 min-w-4.5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold shrink-0 shadow-xs">
              {unreadCount}
            </span>
          )}
        </div>

        {/* Exchange Pill Context if applicable */}
        {exchange && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-muted-foreground/90 bg-muted/50 rounded-md px-1.5 py-0.5 w-fit max-w-full">
            <BookOpen className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{exchange.bookTitle}</span>
          </div>
        )}
      </div>
    </button>
  );
};
