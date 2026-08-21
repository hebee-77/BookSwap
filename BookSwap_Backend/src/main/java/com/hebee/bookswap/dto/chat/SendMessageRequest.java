package com.hebee.bookswap.dto.chat;

import com.hebee.bookswap.constant.MessageType;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

public class SendMessageRequest {

    @NotNull(message = "conversationId is required")
    private Long conversationId;

    private String content;

    private MessageType messageType = MessageType.TEXT;

    private Long replyToMessageId;

    private List<String> attachmentUrls = new ArrayList<>();

    public SendMessageRequest() {
    }

    public SendMessageRequest(Long conversationId, String content, MessageType messageType, Long replyToMessageId) {
        this.conversationId = conversationId;
        this.content = content;
        this.messageType = messageType;
        this.replyToMessageId = replyToMessageId;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
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

    public Long getReplyToMessageId() {
        return replyToMessageId;
    }

    public void setReplyToMessageId(Long replyToMessageId) {
        this.replyToMessageId = replyToMessageId;
    }

    public List<String> getAttachmentUrls() {
        return attachmentUrls;
    }

    public void setAttachmentUrls(List<String> attachmentUrls) {
        this.attachmentUrls = attachmentUrls;
    }
}
