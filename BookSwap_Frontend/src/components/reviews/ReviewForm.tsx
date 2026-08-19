import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import { RatingStars } from './RatingStars';
import { Button } from '../ui/button';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comment: z.string().max(500, 'Comment must not exceed 500 characters').optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  exchangeRequestId: number;
  onSubmitSuccess: () => void;
  onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  exchangeRequestId,
  onSubmitSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ReviewFormData) =>
      reviewService.createReview({
        exchangeRequestId,
        rating: data.rating,
        comment: data.comment || undefined,
      }),
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      // Invalidate all related state queries
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['average-rating'] });
      queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['sent-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['received-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onSubmitSuccess();
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to submit review. Please try again.';
      toast.error(errMsg);
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Rating Field */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground block">
          Rating <span className="text-destructive">*</span>
        </label>
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <RatingStars
                rating={field.value}
                interactive={true}
                onChange={field.onChange}
                size="lg"
              />
              <span className="text-xs text-muted-foreground font-semibold mt-1">
                {field.value > 0 ? `${field.value} out of 5 stars selected` : 'Select a rating'}
              </span>
            </div>
          )}
        />
        {errors.rating && (
          <p className="text-xs font-bold text-destructive animate-in fade-in">
            {errors.rating.message}
          </p>
        )}
      </div>

      {/* Comment Field */}
      <div className="space-y-2">
        <label htmlFor="comment" className="text-sm font-bold text-foreground block">
          Review Feedback <span className="text-xs font-medium text-muted-foreground">(Optional)</span>
        </label>
        <Controller
          name="comment"
          control={control}
          render={({ field }) => (
            <textarea
              id="comment"
              placeholder="Share your exchange experience. Was the user responsive? Was the book in the described condition?"
              value={field.value}
              onChange={field.onChange}
              rows={4}
              maxLength={500}
              className="w-full px-4.5 py-3 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground resize-none"
            />
          )}
        />
        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold px-1">
          {errors.comment ? (
            <p className="text-destructive">{errors.comment.message}</p>
          ) : (
            <span />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={onCancel}
            className="font-semibold"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="font-bold flex items-center gap-2 shadow-sm"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <span>Submit Review</span>
          )}
        </Button>
      </div>
    </form>
  );
};
