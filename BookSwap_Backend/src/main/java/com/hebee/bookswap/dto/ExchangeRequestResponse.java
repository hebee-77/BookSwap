package com.hebee.bookswap.dto;

import com.hebee.bookswap.constant.ExchangeRequestStatus;
import java.time.LocalDateTime;

public class ExchangeRequestResponse {

    private Long id;
    private Long requesterId;
    private Long ownerId;
    private Long bookId;
    private Long offeredBookId;
    private ExchangeRequestStatus status;
    private LocalDateTime createdAt;

    public ExchangeRequestResponse() {
    }

    public ExchangeRequestResponse(Long id, Long requesterId, Long bookId, ExchangeRequestStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.requesterId = requesterId;
        this.bookId = bookId;
        this.status = status;
        this.createdAt = createdAt;
    }

    public ExchangeRequestResponse(Long id, Long requesterId, Long ownerId, Long bookId, Long offeredBookId, ExchangeRequestStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.requesterId = requesterId;
        this.ownerId = ownerId;
        this.bookId = bookId;
        this.offeredBookId = offeredBookId;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRequesterId() {
        return requesterId;
    }

    public void setRequesterId(Long requesterId) {
        this.requesterId = requesterId;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
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

    public ExchangeRequestStatus getStatus() {
        return status;
    }

    public void setStatus(ExchangeRequestStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
