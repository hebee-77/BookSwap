package com.hebee.bookswap.controller;

import com.hebee.bookswap.dto.chat.SendMessageRequest;
import com.hebee.bookswap.dto.chat.TypingEventDTO;
import com.hebee.bookswap.entity.ConversationParticipant;
import com.hebee.bookswap.repository.ConversationParticipantRepository;
import com.hebee.bookswap.repository.ConversationRepository;
import com.hebee.bookswap.security.CustomUserDetails;
import com.hebee.bookswap.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

@Controller
@SuppressWarnings("null")
public class ChatWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketController.class);

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;

    public ChatWebSocketController(
            ChatService chatService,
            SimpMessagingTemplate messagingTemplate,
            ConversationRepository conversationRepository,
            ConversationParticipantRepository participantRepository) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
    }

    private Long getUserIdFromPrincipal(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof CustomUserDetails userDetails) {
                return userDetails.getUser().getId();
            }
        }
        throw new org.springframework.security.access.AccessDeniedException("Unauthenticated WebSocket session");
    }

    private String getUserNameFromPrincipal(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof CustomUserDetails userDetails) {
                return userDetails.getUser().getName();
            }
        }
        return "User";
    }

    @MessageMapping("/chat.send")
    public void handleSendMessage(Principal principal, @Payload SendMessageRequest request) {
        try {
            Long currentUserId = getUserIdFromPrincipal(principal);
            chatService.sendMessage(currentUserId, request);
        } catch (Exception e) {
            log.error("Error processing STOMP /chat.send: {}", e.getMessage());
        }
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(Principal principal, @Payload TypingEventDTO typingEvent) {
        try {
            Long currentUserId = getUserIdFromPrincipal(principal);
            String userName = getUserNameFromPrincipal(principal);
            Long conversationId = typingEvent.getConversationId();

            if (conversationId != null && conversationRepository.isUserParticipant(conversationId, currentUserId)) {
                typingEvent.setUserId(currentUserId);
                typingEvent.setUserName(userName);

                Optional<ConversationParticipant> other = participantRepository.findOtherParticipant(conversationId, currentUserId);
                other.ifPresent(p -> messagingTemplate.convertAndSendToUser(
                        p.getUser().getEmail(),
                        "/queue/typing",
                        typingEvent
                ));
            }
        } catch (Exception e) {
            log.error("Error processing STOMP /chat.typing: {}", e.getMessage());
        }
    }

    @MessageMapping("/chat.read")
    public void handleRead(Principal principal, @Payload Map<String, Long> payload) {
        try {
            Long currentUserId = getUserIdFromPrincipal(principal);
            Long conversationId = payload.get("conversationId");
            if (conversationId != null) {
                chatService.markConversationAsRead(conversationId, currentUserId);
            }
        } catch (Exception e) {
            log.error("Error processing STOMP /chat.read: {}", e.getMessage());
        }
    }
}
