package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.constant.MessageStatus;
import com.hebee.bookswap.constant.MessageType;
import com.hebee.bookswap.dto.chat.*;
import com.hebee.bookswap.entity.*;
import com.hebee.bookswap.exception.ResourceNotFoundException;
import com.hebee.bookswap.mapper.ChatMapper;
import com.hebee.bookswap.repository.*;
import com.hebee.bookswap.service.ChatService;
import com.hebee.bookswap.service.FileStorageService;
import com.hebee.bookswap.service.PresenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@SuppressWarnings("null")
public class ChatServiceImpl implements ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatServiceImpl.class);

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final MessageAttachmentRepository attachmentRepository;
    private final MessageReceiptRepository receiptRepository;
    private final UserRepository userRepository;
    private final ExchangeRequestRepository exchangeRequestRepository;
    private final FileStorageService fileStorageService;
    private final PresenceService presenceService;
    private final SimpMessageSendingOperations messagingTemplate;
    private final ChatMapper chatMapper;

    public ChatServiceImpl(
            ConversationRepository conversationRepository,
            ConversationParticipantRepository participantRepository,
            MessageRepository messageRepository,
            MessageAttachmentRepository attachmentRepository,
            MessageReceiptRepository receiptRepository,
            UserRepository userRepository,
            ExchangeRequestRepository exchangeRequestRepository,
            FileStorageService fileStorageService,
            PresenceService presenceService,
            SimpMessageSendingOperations messagingTemplate,
            ChatMapper chatMapper) {
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.attachmentRepository = attachmentRepository;
        this.receiptRepository = receiptRepository;
        this.userRepository = userRepository;
        this.exchangeRequestRepository = exchangeRequestRepository;
        this.fileStorageService = fileStorageService;
        this.presenceService = presenceService;
        this.messagingTemplate = messagingTemplate;
        this.chatMapper = chatMapper;
    }

    @Override
    public ConversationDTO getOrCreateConversation(Long currentUserId, Long targetUserId, Long exchangeRequestId) {
        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot start a conversation with yourself");
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found"));

        ExchangeRequest exchangeRequest = null;
        if (exchangeRequestId != null) {
            exchangeRequest = exchangeRequestRepository.findById(exchangeRequestId).orElse(null);
        }

        List<Conversation> existing = conversationRepository.findConversationsBetweenUsers(currentUserId, targetUserId);
        Conversation conversation;

        if (!existing.isEmpty()) {
            conversation = existing.get(0);
            if (exchangeRequest != null && conversation.getExchangeRequest() == null) {
                conversation.setExchangeRequest(exchangeRequest);
                conversation = conversationRepository.save(conversation);
            }
        } else {
            conversation = new Conversation(exchangeRequest);
            conversation = conversationRepository.save(conversation);

            ConversationParticipant p1 = new ConversationParticipant(conversation, currentUser);
            ConversationParticipant p2 = new ConversationParticipant(conversation, targetUser);

            participantRepository.save(p1);
            participantRepository.save(p2);

            conversation.getParticipants().add(p1);
            conversation.getParticipants().add(p2);
        }

        Message latestMessage = messageRepository.findLatestMessageByConversationId(conversation.getId()).orElse(null);
        long unreadCount = participantRepository.countUnreadMessagesForConversationAndUser(conversation.getId(), currentUserId);
        boolean isOnline = presenceService.isUserOnline(targetUserId);

        return chatMapper.toConversationDTO(conversation, targetUser, latestMessage, unreadCount, isOnline);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationDTO> getUserConversations(Long currentUserId) {
        List<Conversation> conversations = conversationRepository.findByUserId(currentUserId);
        List<ConversationDTO> result = new ArrayList<>();

        for (Conversation conv : conversations) {
            Optional<ConversationParticipant> otherParticipantOpt = participantRepository.findOtherParticipant(conv.getId(), currentUserId);
            if (otherParticipantOpt.isPresent()) {
                User otherUser = otherParticipantOpt.get().getUser();
                Message latestMessage = messageRepository.findLatestMessageByConversationId(conv.getId()).orElse(null);
                long unreadCount = participantRepository.countUnreadMessagesForConversationAndUser(conv.getId(), currentUserId);
                boolean isOnline = presenceService.isUserOnline(otherUser.getId());

                result.add(chatMapper.toConversationDTO(conv, otherUser, latestMessage, unreadCount, isOnline));
            }
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationDTO getConversationById(Long conversationId, Long currentUserId) {
        if (!conversationRepository.isUserParticipant(conversationId, currentUserId)) {
            throw new AccessDeniedException("You are not a participant in this conversation");
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        ConversationParticipant otherParticipant = participantRepository.findOtherParticipant(conversationId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Other conversation participant not found"));

        User otherUser = otherParticipant.getUser();
        Message latestMessage = messageRepository.findLatestMessageByConversationId(conversationId).orElse(null);
        long unreadCount = participantRepository.countUnreadMessagesForConversationAndUser(conversationId, currentUserId);
        boolean isOnline = presenceService.isUserOnline(otherUser.getId());

        return chatMapper.toConversationDTO(conversation, otherUser, latestMessage, unreadCount, isOnline);
    }

    @Override
    @Transactional(readOnly = true)
    public MessagePageDTO getConversationMessages(Long conversationId, Long currentUserId, Pageable pageable) {
        if (!conversationRepository.isUserParticipant(conversationId, currentUserId)) {
            throw new AccessDeniedException("You are not a participant in this conversation");
        }

        Page<Message> messagePage = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);

        List<MessageDTO> dtoList = messagePage.getContent().stream()
                .map(chatMapper::toMessageDTO)
                .collect(Collectors.toList());

        return new MessagePageDTO(
                dtoList,
                messagePage.getNumber(),
                messagePage.getSize(),
                messagePage.getTotalElements(),
                messagePage.getTotalPages(),
                messagePage.isLast()
        );
    }

    @Override
    public MessageDTO sendMessage(Long currentUserId, SendMessageRequest request) {
        Long conversationId = request.getConversationId();

        if (!conversationRepository.isUserParticipant(conversationId, currentUserId)) {
            throw new AccessDeniedException("You are not a participant in this conversation");
        }

        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        String content = request.getContent() != null ? request.getContent().trim() : "";
        List<String> attachmentUrls = request.getAttachmentUrls();

        if (content.isEmpty() && (attachmentUrls == null || attachmentUrls.isEmpty())) {
            throw new IllegalArgumentException("Message content or attachment is required");
        }

        if (content.length() > 5000) {
            throw new IllegalArgumentException("Message content cannot exceed 5000 characters");
        }

        MessageType messageType = request.getMessageType() != null ? request.getMessageType() : MessageType.TEXT;
        if (attachmentUrls != null && !attachmentUrls.isEmpty() && messageType == MessageType.TEXT) {
            messageType = MessageType.IMAGE;
        }

        Message message = new Message(conversation, sender, content, messageType);

        // Validate reply to
        if (request.getReplyToMessageId() != null) {
            Message replyTo = messageRepository.findById(request.getReplyToMessageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Replied message not found"));
            if (!replyTo.getConversation().getId().equals(conversationId)) {
                throw new IllegalArgumentException("Cannot reply to a message from a different conversation");
            }
            message.setReplyTo(replyTo);
        }

        ConversationParticipant otherParticipant = participantRepository.findOtherParticipant(conversationId, currentUserId)
                .orElse(null);

        Long recipientId = otherParticipant != null ? otherParticipant.getUser().getId() : null;
        boolean recipientOnline = recipientId != null && presenceService.isUserOnline(recipientId);

        if (recipientOnline) {
            message.setStatus(MessageStatus.DELIVERED);
        } else {
            message.setStatus(MessageStatus.SENT);
        }

        Message savedMessage = messageRepository.save(message);

        // Attachments
        if (attachmentUrls != null && !attachmentUrls.isEmpty()) {
            for (String url : attachmentUrls) {
                if (url != null && !url.trim().isEmpty()) {
                    MessageAttachment attachment = new MessageAttachment(
                            savedMessage,
                            url,
                            extractFilename(url),
                            guessMimeType(url),
                            0L
                    );
                    attachmentRepository.save(attachment);
                    savedMessage.addAttachment(attachment);
                }
            }
        }

        // Message receipt
        if (recipientId != null) {
            User recipient = otherParticipant.getUser();
            MessageReceipt receipt = new MessageReceipt(savedMessage, recipient);
            if (recipientOnline) {
                receipt.setDeliveredAt(LocalDateTime.now());
            }
            receiptRepository.save(receipt);
        }

        // Update conversation timestamp
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        // Update sender lastReadMessageId to their own message
        participantRepository.findByConversationIdAndUserId(conversationId, currentUserId)
                .ifPresent(cp -> {
                    cp.setLastReadMessageId(savedMessage.getId());
                    cp.setLastReadAt(LocalDateTime.now());
                    participantRepository.save(cp);
                });

        MessageDTO messageDTO = chatMapper.toMessageDTO(savedMessage);

        // Broadcast via STOMP to recipient and sender
        if (recipientId != null) {
            try {
                messagingTemplate.convertAndSendToUser(
                        otherParticipant.getUser().getEmail(),
                        "/queue/messages",
                        messageDTO
                );
            } catch (Exception e) {
                log.error("Failed to send STOMP message to recipient {}: {}", recipientId, e.getMessage());
            }
        }

        try {
            messagingTemplate.convertAndSendToUser(
                    sender.getEmail(),
                    "/queue/messages",
                    messageDTO
            );
        } catch (Exception e) {
            log.error("Failed to echo STOMP message to sender {}: {}", currentUserId, e.getMessage());
        }

        return messageDTO;
    }

    @Override
    public void markConversationAsRead(Long conversationId, Long currentUserId) {
        if (!conversationRepository.isUserParticipant(conversationId, currentUserId)) {
            throw new AccessDeniedException("You are not a participant in this conversation");
        }

        Message latestMessage = messageRepository.findLatestMessageByConversationId(conversationId).orElse(null);
        if (latestMessage == null) {
            return;
        }

        ConversationParticipant participant = participantRepository.findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found"));

        participant.setLastReadMessageId(latestMessage.getId());
        participant.setLastReadAt(LocalDateTime.now());
        participantRepository.save(participant);

        // Mark messages as READ
        messageRepository.updateMessagesStatusForRecipient(conversationId, currentUserId, MessageStatus.READ);

        // Notify other participant about read receipt
        participantRepository.findOtherParticipant(conversationId, currentUserId)
                .ifPresent(other -> {
                    MessageReceiptDTO receiptDTO = new MessageReceiptDTO(
                            conversationId,
                            latestMessage.getId(),
                            currentUserId,
                            MessageStatus.READ,
                            LocalDateTime.now()
                    );
                    try {
                        messagingTemplate.convertAndSendToUser(
                                other.getUser().getEmail(),
                                "/queue/receipts",
                                receiptDTO
                        );
                    } catch (Exception e) {
                        log.error("Failed to send read receipt to {}: {}", other.getUser().getId(), e.getMessage());
                    }
                });
    }

    @Override
    @Transactional(readOnly = true)
    public long getTotalUnreadCount(Long currentUserId) {
        return participantRepository.countTotalUnreadMessagesForUser(currentUserId);
    }

    @Override
    public void deleteMessage(Long conversationId, Long messageId, Long currentUserId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!message.getConversation().getId().equals(conversationId)) {
            throw new IllegalArgumentException("Message does not belong to specified conversation");
        }

        if (message.getSender() == null || !message.getSender().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You are only allowed to delete your own messages");
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        message.setDeletedAt(LocalDateTime.now());
        message.setDeletedBy(user);
        Message saved = messageRepository.save(message);

        MessageDTO deletedDTO = chatMapper.toMessageDTO(saved);

        // Broadcast deleted state to both participants
        participantRepository.findByConversationId(conversationId).forEach(p -> {
            try {
                messagingTemplate.convertAndSendToUser(
                        p.getUser().getEmail(),
                        "/queue/messages",
                        deletedDTO
                );
            } catch (Exception e) {
                log.error("Failed to broadcast message deletion to {}: {}", p.getUser().getId(), e.getMessage());
            }
        });
    }

    @Override
    public MessageAttachmentDTO uploadAttachment(MultipartFile file, Long currentUserId) {
        String fileUrl = fileStorageService.storeFile(file);
        return new MessageAttachmentDTO(
                null,
                fileUrl,
                file.getOriginalFilename(),
                file.getContentType(),
                file.getSize(),
                LocalDateTime.now()
        );
    }

    @Override
    public void sendSystemMessage(Long conversationId, String content) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        Message message = new Message(conversation, null, content, MessageType.SYSTEM);
        message.setStatus(MessageStatus.SENT);
        Message saved = messageRepository.save(message);

        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        MessageDTO dto = chatMapper.toMessageDTO(saved);

        participantRepository.findByConversationId(conversationId).forEach(p -> {
            try {
                messagingTemplate.convertAndSendToUser(
                        p.getUser().getEmail(),
                        "/queue/messages",
                        dto
                );
            } catch (Exception e) {
                log.error("Failed to send system message to user {}: {}", p.getUser().getId(), e.getMessage());
            }
        });
    }

    private String extractFilename(String url) {
        if (url == null) return "";
        int lastSlash = url.lastIndexOf('/');
        return lastSlash >= 0 ? url.substring(lastSlash + 1) : url;
    }

    private String guessMimeType(String url) {
        if (url == null) return "image/jpeg";
        String lower = url.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }
}
