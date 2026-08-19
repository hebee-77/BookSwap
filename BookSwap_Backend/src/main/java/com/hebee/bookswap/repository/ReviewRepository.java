package com.hebee.bookswap.repository;

import com.hebee.bookswap.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByReviewedUserId(Long reviewedUserId);

    List<Review> findByReviewerId(Long reviewerId);

    boolean existsByExchangeRequestIdAndReviewerId(Long exchangeRequestId, Long reviewerId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.reviewedUser.id = :userId")
    Double getAverageRatingForUser(@Param("userId") Long userId);

    long countByReviewedUserId(Long reviewedUserId);
}
