package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.constant.MessageStatus;
import com.hebee.bookswap.constant.MessageType;
import com.hebee.bookswap.dto.chat.ConversationDTO;
import com.hebee.bookswap.dto.chat.MessageDTO;
import com.hebee.bookswap.dto.chat.SendMessageRequest;
import com.hebee.bookswap.entity.Conversation;
import com.hebee.bookswap.entity.ConversationParticipant;
import com.hebee.bookswap.entity.Message;
import com.hebee.bookswap.entity.User;
import com.hebee.bookswap.mapper.ChatMapper;
import com.hebee.bookswap.repository.*;
import com.hebee.bookswap.service.FileStorageService;
import com.hebee.bookswap.service.PresenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.security.access.AccessDeniedException;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class ChatServiceImplTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ConversationParticipantRepository participantRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private MessageAttachmentRepository attachmentRepository;

    @Mock
    private MessageReceiptRepository receiptRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExchangeRequestRepository exchangeRequestRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private PresenceService presenceService;

    @Mock
    private SimpMessageSendingOperations messagingTemplate;

    private ChatServiceImpl chatService;
    private ChatMapper chatMapper;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        chatMapper = new ChatMapper();
        chatService = new ChatServiceImpl(
                conversationRepository,
                participantRepository,
                messageRepository,
                attachmentRepository,
                receiptRepository,
                userRepository,
                exchangeRequestRepository,
                fileStorageService,
                presenceService,
                messagingTemplate,
                chatMapper
        );

        user1 = new User("Alice", "alice@example.com", "password");
        user1.setId(1L);

        user2 = new User("Bob", "bob@example.com", "password");
        user2.setId(2L);
    }

    @Test
    void testCreateConversation_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));
        when(conversationRepository.findConversationsBetweenUsers(1L, 2L)).thenReturn(Collections.emptyList());

        Conversation conv = new Conversation();
        conv.setId(10L);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conv);
        when(participantRepository.countUnreadMessagesForConversationAndUser(10L, 1L)).thenReturn(0L);
        when(presenceService.isUserOnline(2L)).thenReturn(true);

        ConversationDTO result = chatService.getOrCreateConversation(1L, 2L, null);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("Bob", result.getParticipant().getName());
        assertTrue(result.isOnline());
        verify(participantRepository, times(2)).save(any(ConversationParticipant.class));
    }

    @Test
    void testCreateConversation_SelfConversationThrows() {
        assertThrows(IllegalArgumentException.class, () ->
                chatService.getOrCreateConversation(1L, 1L, null)
        );
    }

    @Test
    void testCreateConversation_DuplicateReturnsExisting() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));

        Conversation existingConv = new Conversation();
        existingConv.setId(15L);
        when(conversationRepository.findConversationsBetweenUsers(1L, 2L)).thenReturn(List.of(existingConv));
        when(presenceService.isUserOnline(2L)).thenReturn(false);

        ConversationDTO result = chatService.getOrCreateConversation(1L, 2L, null);

        assertNotNull(result);
        assertEquals(15L, result.getId());
        assertFalse(result.isOnline());
        verify(participantRepository, never()).save(any(ConversationParticipant.class));
    }

    @Test
    void testSendMessage_Success() {
        when(conversationRepository.isUserParticipant(10L, 1L)).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));

        Conversation conv = new Conversation();
        conv.setId(10L);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conv));

        ConversationParticipant otherParticipant = new ConversationParticipant(conv, user2);
        when(participantRepository.findOtherParticipant(10L, 1L)).thenReturn(Optional.of(otherParticipant));
        when(presenceService.isUserOnline(2L)).thenReturn(true);

        Message savedMessage = new Message(conv, user1, "Hello Bob!", MessageType.TEXT);
        savedMessage.setId(100L);
        savedMessage.setStatus(MessageStatus.DELIVERED);
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);

        ConversationParticipant p1 = new ConversationParticipant(conv, user1);
        when(participantRepository.findByConversationIdAndUserId(10L, 1L)).thenReturn(Optional.of(p1));

        SendMessageRequest request = new SendMessageRequest(10L, "Hello Bob!", MessageType.TEXT, null);
        MessageDTO result = chatService.sendMessage(1L, request);

        assertNotNull(result);
        assertEquals(100L, result.getId());
        assertEquals("Hello Bob!", result.getContent());
        assertEquals(MessageStatus.DELIVERED, result.getStatus());
        verify(messagingTemplate).convertAndSendToUser(eq("bob@example.com"), eq("/queue/messages"), any(MessageDTO.class));
    }

    @Test
    void testSendMessage_NotParticipant_ThrowsAccessDenied() {
        when(conversationRepository.isUserParticipant(10L, 1L)).thenReturn(false);

        SendMessageRequest request = new SendMessageRequest(10L, "Hello!", MessageType.TEXT, null);
        assertThrows(AccessDeniedException.class, () -> chatService.sendMessage(1L, request));
    }

    @Test
    void testDeleteMessage_Success() {
        Conversation conv = new Conversation();
        conv.setId(10L);

        Message message = new Message(conv, user1, "Secret message", MessageType.TEXT);
        message.setId(101L);

        when(messageRepository.findById(101L)).thenReturn(Optional.of(message));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> invocation.getArgument(0));

        chatService.deleteMessage(10L, 101L, 1L);

        assertNotNull(message.getDeletedAt());
        assertEquals(user1, message.getDeletedBy());
    }

    @Test
    void testDeleteMessage_NotSender_ThrowsAccessDenied() {
        Conversation conv = new Conversation();
        conv.setId(10L);

        Message message = new Message(conv, user2, "Bob's message", MessageType.TEXT);
        message.setId(102L);

        when(messageRepository.findById(102L)).thenReturn(Optional.of(message));

        assertThrows(AccessDeniedException.class, () -> chatService.deleteMessage(10L, 102L, 1L));
    }

    @Test
    void testMarkConversationAsRead_Success() {
        when(conversationRepository.isUserParticipant(10L, 1L)).thenReturn(true);

        Conversation conv = new Conversation();
        conv.setId(10L);

        Message latestMsg = new Message(conv, user2, "Hey", MessageType.TEXT);
        latestMsg.setId(200L);
        when(messageRepository.findLatestMessageByConversationId(10L)).thenReturn(Optional.of(latestMsg));

        ConversationParticipant cp = new ConversationParticipant(conv, user1);
        when(participantRepository.findByConversationIdAndUserId(10L, 1L)).thenReturn(Optional.of(cp));

        ConversationParticipant other = new ConversationParticipant(conv, user2);
        when(participantRepository.findOtherParticipant(10L, 1L)).thenReturn(Optional.of(other));

        chatService.markConversationAsRead(10L, 1L);

        assertEquals(200L, cp.getLastReadMessageId());
        verify(messageRepository).updateMessagesStatusForRecipient(10L, 1L, MessageStatus.READ);
        verify(messagingTemplate).convertAndSendToUser(eq("bob@example.com"), eq("/queue/receipts"), any());
    }

    @Test
    void testGetTotalUnreadCount_Success() {
        when(participantRepository.countTotalUnreadMessagesForUser(1L)).thenReturn(5L);

        long count = chatService.getTotalUnreadCount(1L);
        assertEquals(5L, count);
    }
}
