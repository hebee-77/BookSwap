import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReviewCard } from './ReviewCard';
import { EmptyReviews } from './EmptyReviews';
import type { Review } from '../../types/review';

interface ReviewListProps {
  reviews: Review[];
  showReviewedUser?: boolean;
  onDelete?: (id: number) => void;
  isDeletingId?: number | null;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  showReviewedUser = false,
  onDelete,
  isDeletingId = null,
}) => {
  if (reviews.length === 0) {
    return <EmptyReviews />;
  }

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {reviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <ReviewCard
              review={review}
              showReviewedUser={showReviewedUser}
              onDelete={onDelete}
              isDeleting={isDeletingId === review.id}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
