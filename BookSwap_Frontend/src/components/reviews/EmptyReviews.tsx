import React from 'react';
import { Star } from 'lucide-react';

export const EmptyReviews: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-border border-dashed rounded-2xl bg-muted/10 space-y-3">
      <div className="p-3 bg-muted rounded-full text-muted-foreground/60">
        <Star className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h4 className="font-extrabold text-sm text-foreground">No reviews yet</h4>
        <p className="text-xs text-muted-foreground max-w-[260px] font-semibold leading-relaxed">
          Complete swap requests with other members to start building your platform reputation!
        </p>
      </div>
    </div>
  );
};
