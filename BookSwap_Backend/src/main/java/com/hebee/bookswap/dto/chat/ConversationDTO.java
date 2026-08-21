package com.hebee.bookswap.dto.chat;

import java.time.LocalDateTime;

public class ConversationDTO {
    private Long id;
    private UserSummaryDTO participant;
    private MessageDTO lastMessage;
    private long unreadCount;
    private boolean online;
    private ExchangeSummaryDTO exchange;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ConversationDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserSummaryDTO getParticipant() {
        return participant;
    }

    public void setParticipant(UserSummaryDTO participant) {
        this.participant = participant;
    }

    public MessageDTO getLastMessage() {
        return lastMessage;
    }

    public void setLastMessage(MessageDTO lastMessage) {
        this.lastMessage = lastMessage;
    }

    public long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(long unreadCount) {
        this.unreadCount = unreadCount;
    }

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }

    public ExchangeSummaryDTO getExchange() {
        return exchange;
    }

    public void setExchange(ExchangeSummaryDTO exchange) {
        this.exchange = exchange;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
