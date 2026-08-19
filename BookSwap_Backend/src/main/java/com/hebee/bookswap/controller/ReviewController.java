package com.hebee.bookswap.controller;

import com.hebee.bookswap.dto.ReviewRequest;
import com.hebee.bookswap.dto.ReviewResponse;
import com.hebee.bookswap.dto.AverageRatingResponse;
import com.hebee.bookswap.entity.User;
import com.hebee.bookswap.repository.UserRepository;
import com.hebee.bookswap.service.ReviewService;
import com.hebee.bookswap.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    public ReviewController(ReviewService reviewService, UserRepository userRepository) {
        this.reviewService = reviewService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(@Valid @RequestBody ReviewRequest request) {
        User user = getAuthenticatedUser();
        ReviewResponse response = reviewService.createReview(request, user.getId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsForUser(@PathVariable Long userId) {
        List<ReviewResponse> response = reviewService.getReviewsForUser(userId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{userId}/average")
    public ResponseEntity<AverageRatingResponse> getAverageRatingForUser(@PathVariable Long userId) {
        AverageRatingResponse response = reviewService.getAverageRatingForUser(userId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/my-reviews")
    public ResponseEntity<List<ReviewResponse>> getMyReviews() {
        User user = getAuthenticatedUser();
        List<ReviewResponse> response = reviewService.getReviewsWrittenByUser(user.getId());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"));
        reviewService.deleteReview(id, user.getId(), isAdmin);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
