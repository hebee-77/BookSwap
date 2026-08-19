export interface Review {
  id: number;
  reviewerId: number;
  reviewerName: string;
  reviewedUserId: number;
  reviewedUserName: string;
  rating: number;
  comment: string;
  exchangeRequestId: number;
  createdAt: string;
}

export interface ReviewRequest {
  exchangeRequestId: number;
  rating: number;
  comment?: string;
}

export interface AverageRatingResponse {
  averageRating: number;
  totalReviews: number;
}
