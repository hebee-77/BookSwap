import React from 'react';
import { Card } from '../ui/card';

export const NotificationSkeleton: React.FC = () => {
  return (
    <Card className="p-4 border border-border bg-card shadow-sm animate-pulse flex items-start gap-4">
      <div className="h-9 w-9 rounded-full bg-muted flex-shrink-0" />
      <div className="flex-grow space-y-2.5 min-w-0">
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-3 bg-muted rounded w-1/4" />
      </div>
    </Card>
  );
};
