package com.hebee.bookswap.dto.chat;

import com.hebee.bookswap.constant.MessageStatus;
import com.hebee.bookswap.constant.MessageType;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class MessageDTO {
    private Long id;
    private Long conversationId;
    private UserSummaryDTO sender;
    private String content;
    private MessageType messageType;
    private MessageStatus status;
    private MessageReplyDTO replyTo;
    private List<MessageAttachmentDTO> attachments = new ArrayList<>();
    private boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public MessageDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public UserSummaryDTO getSender() {
        return sender;
    }

    public void setSender(UserSummaryDTO sender) {
        this.sender = sender;
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

    public MessageStatus getStatus() {
        return status;
    }

    public void setStatus(MessageStatus status) {
        this.status = status;
    }

    public MessageReplyDTO getReplyTo() {
        return replyTo;
    }

    public void setReplyTo(MessageReplyDTO replyTo) {
        this.replyTo = replyTo;
    }

    public List<MessageAttachmentDTO> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<MessageAttachmentDTO> attachments) {
        this.attachments = attachments;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
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
