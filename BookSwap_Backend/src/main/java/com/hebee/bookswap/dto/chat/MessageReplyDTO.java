package com.hebee.bookswap.dto.chat;

import com.hebee.bookswap.constant.MessageType;
import java.time.LocalDateTime;

public class MessageReplyDTO {
    private Long id;
    private Long senderId;
    private String senderName;
    private String content;
    private MessageType messageType;
    private LocalDateTime createdAt;

    public MessageReplyDTO() {
    }

    public MessageReplyDTO(Long id, Long senderId, String senderName, String content, MessageType messageType, LocalDateTime createdAt) {
        this.id = id;
        this.senderId = senderId;
        this.senderName = senderName;
        this.content = content;
        this.messageType = messageType;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public MessageType getMessageType() {
        return messageType;
    }

    public void setMessageType(MessageType messageType) {
        this.messageType = messageType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
