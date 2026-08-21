package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.dto.chat.PresenceEventDTO;
import com.hebee.bookswap.service.PresenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceServiceImpl implements PresenceService {

    private static final Logger log = LoggerFactory.getLogger(PresenceServiceImpl.class);

    private final SimpMessageSendingOperations messagingTemplate;
    private final Map<Long, Set<String>> userSessions = new ConcurrentHashMap<>();

    public PresenceServiceImpl(SimpMessageSendingOperations messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void userConnected(Long userId, String sessionId) {
        if (userId == null || sessionId == null) {
            return;
        }

        userSessions.compute(userId, (key, sessions) -> {
            if (sessions == null) {
                sessions = Collections.newSetFromMap(new ConcurrentHashMap<>());
                sessions.add(sessionId);
                publishPresence(userId, true);
                log.info("User {} is now ONLINE (session {})", userId, sessionId);
            } else {
                sessions.add(sessionId);
                log.debug("User {} connected another session {}", userId, sessionId);
            }
            return sessions;
        });
    }

    @Override
    public void userDisconnected(Long userId, String sessionId) {
        if (userId == null || sessionId == null) {
            return;
        }

        userSessions.compute(userId, (key, sessions) -> {
            if (sessions != null) {
                sessions.remove(sessionId);
                if (sessions.isEmpty()) {
                    publishPresence(userId, false);
                    log.info("User {} is now OFFLINE (last session {} ended)", userId, sessionId);
                    return null;
                }
            }
            return sessions;
        });
    }

    @Override
    public boolean isUserOnline(Long userId) {
        if (userId == null) {
            return false;
        }
        Set<String> sessions = userSessions.get(userId);
        return sessions != null && !sessions.isEmpty();
    }

    @Override
    public void publishPresence(Long userId, boolean online) {
        try {
            PresenceEventDTO event = new PresenceEventDTO(userId, online, LocalDateTime.now());
            messagingTemplate.convertAndSend("/topic/presence", event);
        } catch (Exception e) {
            log.error("Failed to publish presence event for user {}: {}", userId, e.getMessage());
        }
    }
}
