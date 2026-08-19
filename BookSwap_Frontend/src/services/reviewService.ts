import api from './api';
import type { Review, ReviewRequest, AverageRatingResponse } from '../types/review';

export const reviewService = {
  createReview: async (review: ReviewRequest): Promise<Review> => {
    const response = await api.post<Review>('/reviews', review);
    return response.data;
  },

  getReviewsForUser: async (userId: number): Promise<Review[]> => {
    const response = await api.get<Review[]>(`/reviews/user/${userId}`);
    return response.data;
  },

  getAverageRatingForUser: async (userId: number): Promise<AverageRatingResponse> => {
    const response = await api.get<AverageRatingResponse>(`/reviews/user/${userId}/average`);
    return response.data;
  },

  getMyReviews: async (): Promise<Review[]> => {
    const response = await api.get<Review[]>('/reviews/my-reviews');
    return response.data;
  },

  deleteReview: async (id: number): Promise<void> => {
    await api.delete(`/reviews/${id}`);
  },
};
