import React from 'react';
import { Calendar, Trash2 } from 'lucide-react';
import { RatingStars } from './RatingStars';
import type { Review } from '../../types/review';
import { Button } from '../ui/button';

interface ReviewCardProps {
  review: Review;
  showReviewedUser?: boolean;
  onDelete?: (id: number) => void;
  isDeleting?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  showReviewedUser = false,
  onDelete,
  isDeleting = false,
}) => {
  const nameToDisplay = showReviewedUser ? review.reviewedUserName : review.reviewerName;
  const initial = nameToDisplay ? nameToDisplay.charAt(0).toUpperCase() : 'U';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200 flex gap-4 items-start relative group">
      {/* Avatar Initials Bubble */}
      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm border border-primary/20 shrink-0 select-none">
        {initial}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h4 className="font-extrabold text-sm text-foreground leading-tight">
              {showReviewedUser ? `Review for ${nameToDisplay}` : nameToDisplay}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <RatingStars rating={review.rating} size="sm" />
              <span className="text-[10px] text-muted-foreground font-semibold">
                ({review.rating}/5)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(review.createdAt)}</span>
          </div>
        </div>

        {review.comment && (
          <p className="text-xs text-muted-foreground leading-relaxed font-medium bg-muted/20 border border-border/40 p-3 rounded-xl">
            "{review.comment}"
          </p>
        )}
      </div>

      {/* Delete Trigger */}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          disabled={isDeleting}
          onClick={() => onDelete(review.id)}
          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity absolute right-4 top-4"
          aria-label="Delete review"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
