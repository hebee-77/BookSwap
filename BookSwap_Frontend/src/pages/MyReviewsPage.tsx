import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '../services/reviewService';
import { ReviewList } from '../components/reviews/ReviewList';
import { ReviewSkeleton } from '../components/reviews/ReviewSkeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

export const MyReviewsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch reviews written by the current user
  const { data: reviews = [], isLoading, isError } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => reviewService.getMyReviews(),
  });

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => reviewService.deleteReview(id),
    onMutate: (id) => {
      setDeletingId(id);
    },
    onSuccess: () => {
      toast.success('Review deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['public-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['public-rating-stats'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['average-rating'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const handleDeleteReview = (id: number) => {
    if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">My Submitted Reviews</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View, audit, or delete feedback you have written for other BookSwap members.
        </p>
      </div>

      <Card className="border border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">Reviews Directory</CardTitle>
          <CardDescription>
            Audit feedback you submitted. Deleted reviews instantly recalculate recipient scores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ReviewSkeleton />
          ) : isError ? (
            <div className="py-8 text-center text-sm font-semibold text-destructive">
              Error fetching your reviews. Please try again.
            </div>
          ) : (
            <ReviewList
              reviews={reviews}
              showReviewedUser={true}
              onDelete={handleDeleteReview}
              isDeletingId={deletingId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
