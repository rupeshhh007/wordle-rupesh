package com.wordlearena.websocket.service;

import com.wordlearena.websocket.dto.PresenceEventDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserPresenceService {

    private static final Logger log = LoggerFactory.getLogger(UserPresenceService.class);

    private final SimpMessagingTemplate messagingTemplate;

    // Maps lowercase username -> set of active STOMP session IDs
    private final ConcurrentHashMap<String, Set<String>> userSessions = new ConcurrentHashMap<>();

    // Maps session ID -> lowercase username
    private final ConcurrentHashMap<String, String> sessionToUser = new ConcurrentHashMap<>();

    // Maps lowercase username -> original display username
    private final ConcurrentHashMap<String, String> displayUsernames = new ConcurrentHashMap<>();

    public UserPresenceService(@Lazy SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Registers a user session upon WebSocket connection.
     * If this is the user's first active session, broadcasts an ONLINE presence event.
     */
    public void onUserConnected(String username, String sessionId) {
        if (username == null || sessionId == null) return;

        String key = username.toLowerCase();
        displayUsernames.put(key, username);
        sessionToUser.put(sessionId, key);

        Set<String> sessions = userSessions.computeIfAbsent(key, k -> ConcurrentHashMap.newKeySet());
        boolean wasEmpty = sessions.isEmpty();
        sessions.add(sessionId);

        if (wasEmpty) {
            log.info("User {} is now ONLINE (session: {})", username, sessionId);
            broadcastPresence(username, "ONLINE");
        }
    }

    /**
     * Handles WebSocket session disconnect.
     * If the user has no remaining active sessions, broadcasts an OFFLINE presence event.
     */
    public void onUserDisconnected(String sessionId) {
        if (sessionId == null) return;

        String key = sessionToUser.remove(sessionId);
        if (key != null) {
            Set<String> sessions = userSessions.get(key);
            if (sessions != null) {
                sessions.remove(sessionId);
                if (sessions.isEmpty()) {
                    userSessions.remove(key);
                    String display = displayUsernames.getOrDefault(key, key);
                    log.info("User {} is now OFFLINE (last session closed: {})", display, sessionId);
                    broadcastPresence(display, "OFFLINE");
                }
            }
        }
    }

    /**
     * Checks if a user currently has at least one active WebSocket session.
     */
    public boolean isUserOnline(String username) {
        if (username == null) return false;
        Set<String> sessions = userSessions.get(username.toLowerCase());
        return sessions != null && !sessions.isEmpty();
    }

    /**
     * Returns the set of all usernames currently online (in original display casing).
     */
    public Set<String> getOnlineUsers() {
        Set<String> online = ConcurrentHashMap.newKeySet();
        for (String key : userSessions.keySet()) {
            Set<String> sessions = userSessions.get(key);
            if (sessions != null && !sessions.isEmpty()) {
                online.add(displayUsernames.getOrDefault(key, key));
            }
        }
        return Collections.unmodifiableSet(online);
    }

    private void broadcastPresence(String username, String status) {
        PresenceEventDto event = PresenceEventDto.builder()
                .username(username)
                .status(status)
                .timestamp(System.currentTimeMillis())
                .build();

        try {
            messagingTemplate.convertAndSend("/topic/presence", event);
        } catch (Exception e) {
            log.warn("Failed to broadcast presence update for {}: {}", username, e.getMessage());
        }
    }
}
