package com.wordlearena.websocket.listener;

import com.wordlearena.websocket.service.UserPresenceService;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Component
public class WebSocketEventListener {

    private final UserPresenceService presenceService;

    public WebSocketEventListener(@Lazy UserPresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        Principal user = event.getUser();
        if (user != null && user.getName() != null) {
            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
            String sessionId = accessor.getSessionId();
            if (sessionId != null) {
                presenceService.onUserConnected(user.getName(), sessionId);
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        if (sessionId != null) {
            presenceService.onUserDisconnected(sessionId);
        }
    }
}
