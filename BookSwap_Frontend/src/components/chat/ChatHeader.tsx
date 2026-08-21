import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { OnlineIndicator } from './OnlineIndicator';
import type { UserSummary } from '../../types/chat';

interface ChatHeaderProps {
  participant: UserSummary;
  isOnline: boolean;
  isTyping: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  participant,
  isOnline,
  isTyping,
  onBack,
  showBackButton,
}) => {
  const initial = participant.name ? participant.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/75 backdrop-blur shrink-0 shadow-2xs">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Back Button */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden h-8 w-8 rounded-full shrink-0 -ml-1 text-muted-foreground hover:text-foreground"
            title="Back to conversations"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Avatar with Online Dot */}
        <div className="relative shrink-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm select-none">
            {initial}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5">
            <OnlineIndicator online={isOnline} size="sm" />
          </div>
        </div>

        {/* User Details */}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground truncate leading-tight">
            {participant.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isTyping ? (
              <span className="text-xs font-semibold text-primary animate-pulse">
                typing...
              </span>
            ) : (
              <span
                className={`text-[11px] font-medium ${
                  isOnline ? 'text-emerald-500 font-semibold' : 'text-muted-foreground'
                }`}
              >
                {isOnline ? 'Active Now' : 'Offline'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        <Link to={`/users/${participant.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 rounded-lg border-border/80 text-muted-foreground hover:text-foreground font-medium"
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
