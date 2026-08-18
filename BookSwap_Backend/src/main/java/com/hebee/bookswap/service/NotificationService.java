package com.hebee.bookswap.service;

import com.hebee.bookswap.dto.NotificationResponse;
import com.hebee.bookswap.entity.User;
import java.util.List;

public interface NotificationService {

    List<NotificationResponse> getNotificationsForUser(Long userId);

    NotificationResponse markAsRead(Long notificationId, Long userId);

    void markAllAsRead(Long userId);

    void deleteNotification(Long notificationId, Long userId);

    void createNotification(User user, String type, String message, Long relatedEntityId);
}
