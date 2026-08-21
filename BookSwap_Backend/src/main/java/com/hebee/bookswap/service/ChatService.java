package com.hebee.bookswap.service;

import com.hebee.bookswap.dto.chat.*;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ChatService {

    ConversationDTO getOrCreateConversation(Long currentUserId, Long targetUserId, Long exchangeRequestId);

    List<ConversationDTO> getUserConversations(Long currentUserId);

    ConversationDTO getConversationById(Long conversationId, Long currentUserId);

    MessagePageDTO getConversationMessages(Long conversationId, Long currentUserId, Pageable pageable);

    MessageDTO sendMessage(Long currentUserId, SendMessageRequest request);

    void markConversationAsRead(Long conversationId, Long currentUserId);

    long getTotalUnreadCount(Long currentUserId);

    void deleteMessage(Long conversationId, Long messageId, Long currentUserId);

    MessageAttachmentDTO uploadAttachment(MultipartFile file, Long currentUserId);

    void sendSystemMessage(Long conversationId, String content);
}
