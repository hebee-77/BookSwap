import React from 'react';

export const ReviewSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-border bg-card shadow-sm flex gap-4 items-start animate-pulse"
        >
          {/* Avatar circle */}
          <div className="h-10 w-10 rounded-full bg-muted shrink-0" />

          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-center">
              {/* Name & Stars block */}
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-28" />
                <div className="h-3 bg-muted rounded w-20" />
              </div>
              {/* Date */}
              <div className="h-3 bg-muted rounded w-16" />
            </div>

            {/* Comment block */}
            <div className="h-12 bg-muted/60 rounded-xl w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};
