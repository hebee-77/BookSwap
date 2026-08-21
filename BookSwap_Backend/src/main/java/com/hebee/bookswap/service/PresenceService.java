package com.hebee.bookswap.service;

public interface PresenceService {
    void userConnected(Long userId, String sessionId);
    void userDisconnected(Long userId, String sessionId);
    boolean isUserOnline(Long userId);
    void publishPresence(Long userId, boolean online);
}
