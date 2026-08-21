package com.hebee.bookswap.controller;

import com.hebee.bookswap.dto.chat.*;
import com.hebee.bookswap.entity.User;
import com.hebee.bookswap.exception.ResourceNotFoundException;
import com.hebee.bookswap.repository.UserRepository;
import com.hebee.bookswap.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ChatService chatService;
    private final UserRepository userRepository;

    public ConversationController(ChatService chatService, UserRepository userRepository) {
        this.chatService = chatService;
        this.userRepository = userRepository;
    }

    private Long getAuthenticatedUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
        return user.getId();
    }

    @GetMapping
    public ResponseEntity<List<ConversationDTO>> getConversations() {
        Long currentUserId = getAuthenticatedUserId();
        List<ConversationDTO> conversations = chatService.getUserConversations(currentUserId);
        return ResponseEntity.ok(conversations);
    }

    @PostMapping
    public ResponseEntity<ConversationDTO> getOrCreateConversation(@Valid @RequestBody CreateConversationRequest request) {
        Long currentUserId = getAuthenticatedUserId();
        ConversationDTO conversation = chatService.getOrCreateConversation(
                currentUserId,
                request.getUserId(),
                request.getExchangeRequestId()
        );
        return new ResponseEntity<>(conversation, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConversationDTO> getConversationById(@PathVariable Long id) {
        Long currentUserId = getAuthenticatedUserId();
        ConversationDTO conversation = chatService.getConversationById(id, currentUserId);
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<MessagePageDTO> getConversationMessages(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        Long currentUserId = getAuthenticatedUserId();
        Pageable pageable = PageRequest.of(page, size);
        MessagePageDTO messages = chatService.getConversationMessages(id, currentUserId, pageable);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<MessageDTO> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest request) {
        Long currentUserId = getAuthenticatedUserId();
        request.setConversationId(id);
        MessageDTO message = chatService.sendMessage(currentUserId, request);
        return new ResponseEntity<>(message, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        Long currentUserId = getAuthenticatedUserId();
        chatService.markConversationAsRead(id, currentUserId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        Long currentUserId = getAuthenticatedUserId();
        long count = chatService.getTotalUnreadCount(currentUserId);
        return ResponseEntity.ok(Collections.singletonMap("count", count));
    }

    @DeleteMapping("/{id}/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id, @PathVariable Long messageId) {
        Long currentUserId = getAuthenticatedUserId();
        chatService.deleteMessage(id, messageId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MessageAttachmentDTO> uploadAttachment(@RequestParam("file") MultipartFile file) {
        Long currentUserId = getAuthenticatedUserId();
        MessageAttachmentDTO attachment = chatService.uploadAttachment(file, currentUserId);
        return new ResponseEntity<>(attachment, HttpStatus.CREATED);
    }
}
