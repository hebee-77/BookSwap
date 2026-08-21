package com.hebee.bookswap.dto.chat;

import java.time.LocalDateTime;

public class PresenceEventDTO {
    private Long userId;
    private boolean online;
    private LocalDateTime timestamp;

    public PresenceEventDTO() {
    }

    public PresenceEventDTO(Long userId, boolean online, LocalDateTime timestamp) {
        this.userId = userId;
        this.online = online;
        this.timestamp = timestamp;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
