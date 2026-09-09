package com.wordlearena.websocket.controller;

import com.wordlearena.websocket.service.UserPresenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/presence")
public class PresenceController {

    private final UserPresenceService presenceService;

    public PresenceController(UserPresenceService presenceService) {
        this.presenceService = presenceService;
    }

    /**
     * Returns the set of all usernames currently active on WebSocket.
     */
    @GetMapping("/online")
    public ResponseEntity<Set<String>> getOnlineUsers() {
        return ResponseEntity.ok(presenceService.getOnlineUsers());
    }

    /**
     * Checks if a specific username is currently online.
     */
    @GetMapping("/status/{username}")
    public ResponseEntity<Map<String, Object>> getUserStatus(@PathVariable String username) {
        boolean isOnline = presenceService.isUserOnline(username);
        return ResponseEntity.ok(Map.of(
                "username", username,
                "online", isOnline
        ));
    }
}
