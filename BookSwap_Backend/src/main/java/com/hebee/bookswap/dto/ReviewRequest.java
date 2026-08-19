package com.hebee.bookswap.dto;

import jakarta.validation.constraints.*;

public class ReviewRequest {

    @NotNull(message = "Exchange request ID is required")
    private Long exchangeRequestId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    @Size(max = 500, message = "Comment must not exceed 500 characters")
    private String comment;

    public ReviewRequest() {
    }

    public ReviewRequest(Long exchangeRequestId, Integer rating, String comment) {
        this.exchangeRequestId = exchangeRequestId;
        this.rating = rating;
        this.comment = comment;
    }

    public Long getExchangeRequestId() {
        return exchangeRequestId;
    }

    public void setExchangeRequestId(Long exchangeRequestId) {
        this.exchangeRequestId = exchangeRequestId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
