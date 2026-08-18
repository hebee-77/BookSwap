package com.hebee.bookswap.dto;

import jakarta.validation.constraints.NotNull;

public class ExchangeRequestCreate {

    @NotNull(message = "Book ID is required")
    private Long bookId;

    public ExchangeRequestCreate() {
    }

    public ExchangeRequestCreate(Long bookId) {
        this.bookId = bookId;
    }

    public Long getBookId() {
        return bookId;
    }

    public void setBookId(Long bookId) {
        this.bookId = bookId;
    }
}
