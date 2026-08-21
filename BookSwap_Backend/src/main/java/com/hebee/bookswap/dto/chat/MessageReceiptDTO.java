package com.hebee.bookswap.dto.chat;

import com.hebee.bookswap.constant.MessageStatus;
import java.time.LocalDateTime;

public class MessageReceiptDTO {
    private Long conversationId;
    private Long messageId;
    private Long userId;
    private MessageStatus status;
    private LocalDateTime timestamp;

    public MessageReceiptDTO() {
    }

    public MessageReceiptDTO(Long conversationId, Long messageId, Long userId, MessageStatus status, LocalDateTime timestamp) {
        this.conversationId = conversationId;
        this.messageId = messageId;
        this.userId = userId;
        this.status = status;
        this.timestamp = timestamp;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public Long getMessageId() {
        return messageId;
    }

    public void setMessageId(Long messageId) {
        this.messageId = messageId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public MessageStatus getStatus() {
        return status;
    }

    public void setStatus(MessageStatus status) {
        this.status = status;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
