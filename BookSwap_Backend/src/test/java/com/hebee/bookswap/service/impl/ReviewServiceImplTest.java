package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.dto.AverageRatingResponse;
import com.hebee.bookswap.dto.ReviewRequest;
import com.hebee.bookswap.dto.ReviewResponse;
import com.hebee.bookswap.entity.Book;
import com.hebee.bookswap.entity.ExchangeRequest;
import com.hebee.bookswap.entity.Review;
import com.hebee.bookswap.entity.User;
import com.hebee.bookswap.constant.BookCondition;
import com.hebee.bookswap.constant.ExchangeRequestStatus;
import com.hebee.bookswap.exception.ResourceNotFoundException;
import com.hebee.bookswap.repository.ExchangeRequestRepository;
import com.hebee.bookswap.repository.ReviewRepository;
import com.hebee.bookswap.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class ReviewServiceImplTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ExchangeRequestRepository exchangeRequestRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private User requester;
    private User owner;
    private Book book;
    private ExchangeRequest exchangeRequest;

    @BeforeEach
    void setUp() {
        requester = new User("Requester Alice", "alice@example.com", "password");
        requester.setId(1L);

        owner = new User("Owner Bob", "bob@example.com", "password");
        owner.setId(2L);

        book = new Book("Sample Book", "Author", "123456", "Desc", BookCondition.GOOD, owner);
        book.setId(10L);

        exchangeRequest = new ExchangeRequest(requester, book, ExchangeRequestStatus.ACCEPTED);
        exchangeRequest.setId(100L);
    }

    @Test
    void createReview_Success() {
        // Arrange
        ReviewRequest request = new ReviewRequest(100L, 5, "Great swap!");
        when(exchangeRequestRepository.findById(100L)).thenReturn(Optional.of(exchangeRequest));
        when(reviewRepository.existsByExchangeRequestIdAndReviewerId(100L, 1L)).thenReturn(false);

        Review savedReview = new Review(requester, owner, exchangeRequest, 5, "Great swap!");
        savedReview.setId(500L);
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);

        // Act
        ReviewResponse response = reviewService.createReview(request, 1L);

        // Assert
        assertNotNull(response);
        assertEquals(500L, response.getId());
        assertEquals(1L, response.getReviewerId());
        assertEquals(2L, response.getReviewedUserId());
        assertEquals(5, response.getRating());
        assertEquals("Great swap!", response.getComment());
        verify(reviewRepository, times(1)).save(any(Review.class));
    }

    @Test
    void createReview_ExchangeNotFound() {
        ReviewRequest request = new ReviewRequest(999L, 5, "Comment");
        when(exchangeRequestRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> reviewService.createReview(request, 1L));
    }

    @Test
    void createReview_ExchangeNotAccepted() {
        exchangeRequest.setStatus(ExchangeRequestStatus.PENDING);
        ReviewRequest request = new ReviewRequest(100L, 5, "Comment");
        when(exchangeRequestRepository.findById(100L)).thenReturn(Optional.of(exchangeRequest));

        assertThrows(com.hebee.bookswap.exception.BadRequestException.class, () -> reviewService.createReview(request, 1L));
    }

    @Test
    void createReview_NotAParticipant() {
        ReviewRequest request = new ReviewRequest(100L, 5, "Comment");
        when(exchangeRequestRepository.findById(100L)).thenReturn(Optional.of(exchangeRequest));

        assertThrows(com.hebee.bookswap.exception.ForbiddenException.class, () -> reviewService.createReview(request, 99L));
    }

    @Test
    void createReview_DuplicateReview() {
        ReviewRequest request = new ReviewRequest(100L, 5, "Comment");
        when(exchangeRequestRepository.findById(100L)).thenReturn(Optional.of(exchangeRequest));
        when(reviewRepository.existsByExchangeRequestIdAndReviewerId(100L, 1L)).thenReturn(true);

        assertThrows(com.hebee.bookswap.exception.ConflictException.class, () -> reviewService.createReview(request, 1L));
    }

    @Test
    void getReviewsForUser_Success() {
        when(userRepository.existsById(2L)).thenReturn(true);
        Review review = new Review(requester, owner, exchangeRequest, 4, "Good");
        review.setId(500L);
        when(reviewRepository.findByReviewedUserId(2L)).thenReturn(Arrays.asList(review));

        List<ReviewResponse> result = reviewService.getReviewsForUser(2L);
        assertEquals(1, result.size());
        assertEquals(4, result.get(0).getRating());
    }

    @Test
    void getReviewsForUser_NotFound() {
        when(userRepository.existsById(99L)).thenReturn(false);
        assertThrows(ResourceNotFoundException.class, () -> reviewService.getReviewsForUser(99L));
    }

    @Test
    void getAverageRatingForUser_Success() {
        when(userRepository.existsById(2L)).thenReturn(true);
        when(reviewRepository.countByReviewedUserId(2L)).thenReturn(2L);
        when(reviewRepository.getAverageRatingForUser(2L)).thenReturn(4.55);

        AverageRatingResponse response = reviewService.getAverageRatingForUser(2L);
        assertEquals(4.6, response.getAverageRating());
        assertEquals(2L, response.getTotalReviews());
    }

    @Test
    void deleteReview_Success_AsReviewer() {
        Review review = new Review(requester, owner, exchangeRequest, 5, "Comment");
        review.setId(500L);
        when(reviewRepository.findById(500L)).thenReturn(Optional.of(review));

        reviewService.deleteReview(500L, 1L, false);
        verify(reviewRepository, times(1)).delete(review);
    }

    @Test
    void deleteReview_Success_AsAdmin() {
        Review review = new Review(requester, owner, exchangeRequest, 5, "Comment");
        review.setId(500L);
        when(reviewRepository.findById(500L)).thenReturn(Optional.of(review));

        reviewService.deleteReview(500L, 99L, true);
        verify(reviewRepository, times(1)).delete(review);
    }

    @Test
    void deleteReview_Forbidden() {
        Review review = new Review(requester, owner, exchangeRequest, 5, "Comment");
        review.setId(500L);
        when(reviewRepository.findById(500L)).thenReturn(Optional.of(review));

        assertThrows(com.hebee.bookswap.exception.ForbiddenException.class, () -> reviewService.deleteReview(500L, 2L, false));
    }
}
