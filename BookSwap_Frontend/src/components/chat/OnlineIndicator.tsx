import React from 'react';

interface OnlineIndicatorProps {
  online: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
  online,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-2 w-2 ring-1',
    md: 'h-2.5 w-2.5 ring-2',
    lg: 'h-3.5 w-3.5 ring-2',
  };

  return (
    <span
      className={`relative inline-flex rounded-full ring-background ${sizeClasses[size]} ${
        online ? 'bg-emerald-500' : 'bg-muted-foreground/40'
      } ${className}`}
      title={online ? 'Online' : 'Offline'}
      aria-label={online ? 'Online' : 'Offline'}
    >
      {online && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      )}
    </span>
  );
};
