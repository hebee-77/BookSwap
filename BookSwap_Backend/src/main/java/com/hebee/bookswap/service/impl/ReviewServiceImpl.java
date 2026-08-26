package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.dto.AverageRatingResponse;
import com.hebee.bookswap.dto.ReviewRequest;
import com.hebee.bookswap.dto.ReviewResponse;
import com.hebee.bookswap.entity.ExchangeRequest;
import com.hebee.bookswap.entity.Review;
import com.hebee.bookswap.entity.User;
import com.hebee.bookswap.constant.ExchangeRequestStatus;
import com.hebee.bookswap.exception.ResourceNotFoundException;
import com.hebee.bookswap.repository.ExchangeRequestRepository;
import com.hebee.bookswap.repository.ReviewRepository;
import com.hebee.bookswap.repository.UserRepository;
import com.hebee.bookswap.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ExchangeRequestRepository exchangeRequestRepository;
    private final UserRepository userRepository;

    @Autowired
    public ReviewServiceImpl(ReviewRepository reviewRepository,
                             ExchangeRequestRepository exchangeRequestRepository,
                             UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.exchangeRequestRepository = exchangeRequestRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public ReviewResponse createReview(ReviewRequest reviewRequest, Long reviewerId) {
        // 1. Find ExchangeRequest
        ExchangeRequest exchangeRequest = exchangeRequestRepository.findById(reviewRequest.getExchangeRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));

        // 2. Validate status (must be ACCEPTED)
        if (exchangeRequest.getStatus() != ExchangeRequestStatus.ACCEPTED) {
            throw new IllegalArgumentException("You can only review exchanges that have been accepted");
        }

        // 3. Resolve reviewer & participants
        User requester = exchangeRequest.getRequester();
        User owner = exchangeRequest.getOwner() != null ? exchangeRequest.getOwner() : exchangeRequest.getBook().getOwner();

        if (!reviewerId.equals(requester.getId()) && !reviewerId.equals(owner.getId())) {
            throw new IllegalArgumentException("You are not a participant in this exchange");
        }

        // 4. Resolve reviewed user
        User reviewer = reviewerId.equals(requester.getId()) ? requester : owner;
        User reviewedUser = reviewerId.equals(requester.getId()) ? owner : requester;

        // 5. Prevent self review
        if (reviewer.getId().equals(reviewedUser.getId())) {
            throw new IllegalArgumentException("You cannot review yourself");
        }

        // 6. Check duplicate reviews
        if (reviewRepository.existsByExchangeRequestIdAndReviewerId(exchangeRequest.getId(), reviewer.getId())) {
            throw new IllegalArgumentException("You have already submitted a review for this exchange");
        }

        // 7. Save Review
        Review review = new Review(reviewer, reviewedUser, exchangeRequest, reviewRequest.getRating(), reviewRequest.getComment());
        Review savedReview = reviewRepository.save(review);

        return mapToResponse(savedReview);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsForUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found");
        }
        return reviewRepository.findByReviewedUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsWrittenByUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found");
        }
        return reviewRepository.findByReviewerId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AverageRatingResponse getAverageRatingForUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found");
        }
        long totalReviews = reviewRepository.countByReviewedUserId(userId);
        Double avg = reviewRepository.getAverageRatingForUser(userId);
        double averageRating = (avg != null) ? Math.round(avg * 10.0) / 10.0 : 0.0;
        return new AverageRatingResponse(averageRating, totalReviews);
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId, Long currentUserId, boolean isAdmin) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (!isAdmin && !review.getReviewer().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You do not have permission to delete this review");
        }

        reviewRepository.delete(review);
    }

    private ReviewResponse mapToResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getReviewer().getId(),
                review.getReviewer().getName(),
                review.getReviewedUser().getId(),
                review.getReviewedUser().getName(),
                review.getRating(),
                review.getComment(),
                review.getExchangeRequest() != null ? review.getExchangeRequest().getId() : null,
                review.getCreatedAt()
        );
    }
}
