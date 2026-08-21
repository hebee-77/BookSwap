import React, { useState } from 'react';
import { Search, MessagesSquare, MessageCircle } from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from '../../types/chat';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  isLoading: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    const nameMatch = conv.participant.name.toLowerCase().includes(term);
    const emailMatch = conv.participant.email.toLowerCase().includes(term);
    const bookMatch = conv.exchange?.bookTitle?.toLowerCase().includes(term);
    return nameMatch || emailMatch || !!bookMatch;
  });

  return (
    <div className="flex flex-col h-full bg-card border-r border-border select-none">
      {/* Header & Search */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessagesSquare className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Messages</h2>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {conversations.length}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-2xs transition-colors"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                <div className="h-11 w-11 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded w-24" />
                  <div className="h-2.5 bg-muted rounded w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-6">
            <div className="h-12 w-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-3">
              <MessageCircle className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-foreground">
              {searchTerm ? 'No matching chats' : 'No conversations yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              {searchTerm
                ? 'Try a different search query'
                : 'Start a conversation from any book or user profile!'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
              onClick={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
