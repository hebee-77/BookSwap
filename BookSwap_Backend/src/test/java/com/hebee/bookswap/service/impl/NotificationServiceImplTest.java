package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.dto.NotificationResponse;
import com.hebee.bookswap.entity.Notification;
import com.hebee.bookswap.entity.User;
import com.hebee.bookswap.exception.ResourceNotFoundException;
import com.hebee.bookswap.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User user;
    private User otherUser;
    private Notification notification;

    @BeforeEach
    void setUp() {
        user = new User("Alice", "alice@example.com", "password");
        user.setId(1L);

        otherUser = new User("Bob", "bob@example.com", "password");
        otherUser.setId(2L);

        notification = new Notification(user, "SWAP_REQUEST", "Alice requested your book", 10L);
        notification.setId(100L);
    }

    @Test
    void getNotificationsForUser_Success() {
        // Arrange
        Notification notif2 = new Notification(user, "REQUEST_ACCEPTED", "Request accepted", 11L);
        notif2.setId(101L);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L))
                .thenReturn(Arrays.asList(notification, notif2));

        // Act
        List<NotificationResponse> result = notificationService.getNotificationsForUser(1L);

        // Assert
        assertEquals(2, result.size());
        assertEquals(100L, result.get(0).getId());
        assertEquals("SWAP_REQUEST", result.get(0).getType());
        assertEquals(101L, result.get(1).getId());
        assertEquals("REQUEST_ACCEPTED", result.get(1).getType());
        verify(notificationRepository, times(1)).findByUserIdOrderByCreatedAtDesc(1L);
    }

    @Test
    void markAsRead_Success() {
        // Arrange
        when(notificationRepository.findById(100L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        NotificationResponse response = notificationService.markAsRead(100L, 1L);

        // Assert
        assertTrue(response.isRead());
        verify(notificationRepository, times(1)).findById(100L);
        verify(notificationRepository, times(1)).save(notification);
    }

    @Test
    void markAsRead_NotFound() {
        // Arrange
        when(notificationRepository.findById(100L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            notificationService.markAsRead(100L, 1L);
        });
        verify(notificationRepository, times(1)).findById(100L);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void markAsRead_AccessDenied() {
        // Arrange
        when(notificationRepository.findById(100L)).thenReturn(Optional.of(notification));

        // Act & Assert
        assertThrows(AccessDeniedException.class, () -> {
            notificationService.markAsRead(100L, 2L); // Different user ID
        });
        verify(notificationRepository, times(1)).findById(100L);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void markAllAsRead_Success() {
        // Act
        notificationService.markAllAsRead(1L);

        // Assert
        verify(notificationRepository, times(1)).markAllAsReadForUser(1L);
    }

    @Test
    void deleteNotification_Success() {
        // Arrange
        when(notificationRepository.findById(100L)).thenReturn(Optional.of(notification));

        // Act
        notificationService.deleteNotification(100L, 1L);

        // Assert
        verify(notificationRepository, times(1)).findById(100L);
        verify(notificationRepository, times(1)).delete(notification);
    }

    @Test
    void deleteNotification_NotFound() {
        // Arrange
        when(notificationRepository.findById(100L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            notificationService.deleteNotification(100L, 1L);
        });
        verify(notificationRepository, times(1)).findById(100L);
        verify(notificationRepository, never()).delete(any());
    }

    @Test
    void deleteNotification_AccessDenied() {
        // Arrange
        when(notificationRepository.findById(100L)).thenReturn(Optional.of(notification));

        // Act & Assert
        assertThrows(AccessDeniedException.class, () -> {
            notificationService.deleteNotification(100L, 2L); // Different user ID
        });
        verify(notificationRepository, times(1)).findById(100L);
        verify(notificationRepository, never()).delete(any());
    }

    @Test
    void createNotification_Success() {
        // Act
        notificationService.createNotification(user, "SWAP_REQUEST", "Message", 10L);

        // Assert
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(1)).save(captor.capture());
        Notification saved = captor.getValue();
        assertEquals(user, saved.getUser());
        assertEquals("SWAP_REQUEST", saved.getType());
        assertEquals("Message", saved.getMessage());
        assertEquals(10L, saved.getRelatedEntityId());
    }
}
