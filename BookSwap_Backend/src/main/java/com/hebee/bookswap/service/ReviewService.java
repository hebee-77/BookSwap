package com.hebee.bookswap.service;

import com.hebee.bookswap.dto.ReviewRequest;
import com.hebee.bookswap.dto.ReviewResponse;
import com.hebee.bookswap.dto.AverageRatingResponse;
import java.util.List;

public interface ReviewService {
    ReviewResponse createReview(ReviewRequest reviewRequest, Long reviewerId);
    List<ReviewResponse> getReviewsForUser(Long userId);
    List<ReviewResponse> getReviewsWrittenByUser(Long userId);
    AverageRatingResponse getAverageRatingForUser(Long userId);
    void deleteReview(Long reviewId, Long currentUserId, boolean isAdmin);
}
