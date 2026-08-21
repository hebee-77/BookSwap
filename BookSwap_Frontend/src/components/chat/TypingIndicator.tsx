import React from 'react';

interface TypingIndicatorProps {
  userName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName }) => {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse py-1 px-2">
      <span className="font-medium text-foreground/80">{userName || 'User'} is typing</span>
      <span className="flex gap-1 items-center">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
      </span>
    </div>
  );
};
