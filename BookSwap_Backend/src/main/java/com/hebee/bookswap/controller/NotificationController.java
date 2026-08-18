package com.hebee.bookswap.controller;

import com.hebee.bookswap.dto.NotificationResponse;
import com.hebee.bookswap.entity.User;
import com.hebee.bookswap.exception.ResourceNotFoundException;
import com.hebee.bookswap.repository.UserRepository;
import com.hebee.bookswap.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications() {
        User currentUser = getAuthenticatedUser();
        List<NotificationResponse> response = notificationService.getNotificationsForUser(currentUser.getId());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id) {
        User currentUser = getAuthenticatedUser();
        NotificationResponse response = notificationService.markAsRead(id, currentUser.getId());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        User currentUser = getAuthenticatedUser();
        notificationService.markAllAsRead(currentUser.getId());
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        User currentUser = getAuthenticatedUser();
        notificationService.deleteNotification(id, currentUser.getId());
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
