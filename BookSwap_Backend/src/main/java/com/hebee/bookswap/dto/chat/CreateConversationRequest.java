package com.hebee.bookswap.dto.chat;

import jakarta.validation.constraints.NotNull;

public class CreateConversationRequest {

    @NotNull(message = "userId is required")
    private Long userId;

    private Long exchangeRequestId;

    public CreateConversationRequest() {
    }

    public CreateConversationRequest(Long userId, Long exchangeRequestId) {
        this.userId = userId;
        this.exchangeRequestId = exchangeRequestId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getExchangeRequestId() {
        return exchangeRequestId;
    }

    public void setExchangeRequestId(Long exchangeRequestId) {
        this.exchangeRequestId = exchangeRequestId;
    }
}
