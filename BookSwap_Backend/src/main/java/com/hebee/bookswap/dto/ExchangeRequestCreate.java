package com.hebee.bookswap.dto;

import jakarta.validation.constraints.NotNull;

public class ExchangeRequestCreate {

    @NotNull(message = "Book ID is required")
    private Long bookId;

    private Long offeredBookId;

    public ExchangeRequestCreate() {
    }

    public ExchangeRequestCreate(Long bookId) {
        this.bookId = bookId;
    }

    public ExchangeRequestCreate(Long bookId, Long offeredBookId) {
        this.bookId = bookId;
        this.offeredBookId = offeredBookId;
    }

    public Long getBookId() {
        return bookId;
    }

    public void setBookId(Long bookId) {
        this.bookId = bookId;
    }

    public Long getOfferedBookId() {
        return offeredBookId;
    }

    public void setOfferedBookId(Long offeredBookId) {
        this.offeredBookId = offeredBookId;
    }
}
