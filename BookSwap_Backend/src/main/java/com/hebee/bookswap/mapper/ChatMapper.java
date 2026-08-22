package com.hebee.bookswap.mapper;

import com.hebee.bookswap.dto.chat.*;
import com.hebee.bookswap.entity.*;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

@Component
public class ChatMapper {

    public UserSummaryDTO toUserSummary(User user) {
        if (user == null) {
            return null;
        }
        return new UserSummaryDTO(user.getId(), user.getName(), user.getEmail());
    }

    public ExchangeSummaryDTO toExchangeSummary(ExchangeRequest exchangeRequest) {
        if (exchangeRequest == null) {
            return null;
        }
        ExchangeSummaryDTO dto = new ExchangeSummaryDTO();
        dto.setId(exchangeRequest.getId());
        dto.setStatus(exchangeRequest.getStatus());

        if (exchangeRequest.getBook() != null) {
            dto.setBookId(exchangeRequest.getBook().getId());
            dto.setBookTitle(exchangeRequest.getBook().getTitle());
            dto.setBookAuthor(exchangeRequest.getBook().getAuthor());
            dto.setBookImageUrl(exchangeRequest.getBook().getImageUrl());
            dto.setBookCondition(exchangeRequest.getBook().getBookCondition());
        }

        if (exchangeRequest.getOfferedBook() != null) {
            dto.setOfferedBookId(exchangeRequest.getOfferedBook().getId());
            dto.setOfferedBookTitle(exchangeRequest.getOfferedBook().getTitle());
            dto.setOfferedBookAuthor(exchangeRequest.getOfferedBook().getAuthor());
            dto.setOfferedBookImageUrl(exchangeRequest.getOfferedBook().getImageUrl());
            dto.setOfferedBookCondition(exchangeRequest.getOfferedBook().getBookCondition());
        }

        if (exchangeRequest.getOwner() != null) {
            dto.setOwnerId(exchangeRequest.getOwner().getId());
            dto.setOwnerName(exchangeRequest.getOwner().getName());
        } else if (exchangeRequest.getBook() != null && exchangeRequest.getBook().getOwner() != null) {
            dto.setOwnerId(exchangeRequest.getBook().getOwner().getId());
            dto.setOwnerName(exchangeRequest.getBook().getOwner().getName());
        }

        if (exchangeRequest.getRequester() != null) {
            dto.setRequesterId(exchangeRequest.getRequester().getId());
            dto.setRequesterName(exchangeRequest.getRequester().getName());
        }

        return dto;
    }

    public MessageAttachmentDTO toAttachmentDTO(MessageAttachment attachment) {
        if (attachment == null) {
            return null;
        }
        return new MessageAttachmentDTO(
                attachment.getId(),
                attachment.getFileUrl(),
                attachment.getFileName(),
                attachment.getFileType(),
                attachment.getFileSize(),
                attachment.getCreatedAt()
        );
    }

    public MessageReplyDTO toReplyDTO(Message message) {
        if (message == null) {
            return null;
        }
        Long senderId = message.getSender() != null ? message.getSender().getId() : null;
        String senderName = message.getSender() != null ? message.getSender().getName() : "System";
        String content = message.getDeletedAt() != null ? "This message was deleted" : message.getContent();

        return new MessageReplyDTO(
                message.getId(),
                senderId,
                senderName,
                content,
                message.getMessageType(),
                message.getCreatedAt()
        );
    }

    public MessageDTO toMessageDTO(Message message) {
        if (message == null) {
            return null;
        }
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setConversationId(message.getConversation().getId());
        dto.setSender(toUserSummary(message.getSender()));
        dto.setMessageType(message.getMessageType());
        dto.setStatus(message.getStatus());
        dto.setCreatedAt(message.getCreatedAt());
        dto.setUpdatedAt(message.getUpdatedAt());

        boolean isDeleted = message.getDeletedAt() != null;
        dto.setDeleted(isDeleted);

        if (isDeleted) {
            dto.setContent("This message was deleted");
            dto.setAttachments(Collections.emptyList());
            dto.setReplyTo(null);
        } else {
            dto.setContent(message.getContent());
            if (message.getReplyTo() != null) {
                dto.setReplyTo(toReplyDTO(message.getReplyTo()));
            }
            if (message.getAttachments() != null) {
                dto.setAttachments(
                        message.getAttachments().stream()
                                .map(this::toAttachmentDTO)
                                .collect(Collectors.toList())
                );
            }
        }

        return dto;
    }

    public ConversationDTO toConversationDTO(
            Conversation conversation,
            User otherUser,
            Message lastMessage,
            long unreadCount,
            boolean isOnline) {
        if (conversation == null) {
            return null;
        }
        ConversationDTO dto = new ConversationDTO();
        dto.setId(conversation.getId());
        dto.setParticipant(toUserSummary(otherUser));
        dto.setLastMessage(toMessageDTO(lastMessage));
        dto.setUnreadCount(unreadCount);
        dto.setOnline(isOnline);
        dto.setExchange(toExchangeSummary(conversation.getExchangeRequest()));
        dto.setCreatedAt(conversation.getCreatedAt());
        dto.setUpdatedAt(conversation.getUpdatedAt());
        return dto;
    }
}
