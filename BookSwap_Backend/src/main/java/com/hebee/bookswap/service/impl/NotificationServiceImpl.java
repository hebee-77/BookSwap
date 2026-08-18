package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.dto.NotificationResponse;
import com.hebee.bookswap.entity.Notification;
import com.hebee.bookswap.entity.User;
import com.hebee.bookswap.exception.ResourceNotFoundException;
import com.hebee.bookswap.repository.NotificationRepository;
import com.hebee.bookswap.service.NotificationService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public NotificationResponse markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Access denied: You do not own this notification");
        }

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return mapToResponse(saved);
    }

    @Override
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadForUser(userId);
    }

    @Override
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Access denied: You do not own this notification");
        }

        notificationRepository.delete(notification);
    }

    @Override
    public void createNotification(User user, String type, String message, Long relatedEntityId) {
        Notification notification = new Notification(user, type, message, relatedEntityId);
        notificationRepository.save(notification);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getUser().getId(),
                notification.getType(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt(),
                notification.getRelatedEntityId()
        );
    }
}
