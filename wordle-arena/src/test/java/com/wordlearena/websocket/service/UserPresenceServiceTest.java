package com.wordlearena.websocket.service;

import com.wordlearena.websocket.dto.PresenceEventDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class UserPresenceServiceTest {

    private UserPresenceService presenceService;
    private final List<String> sentDestinations = new ArrayList<>();
    private final List<Object> sentPayloads = new ArrayList<>();

    @BeforeEach
    void setUp() {
        sentDestinations.clear();
        sentPayloads.clear();

        MessageChannel channel = new MessageChannel() {
            @Override
            public boolean send(Message<?> message) {
                return true;
            }

            @Override
            public boolean send(Message<?> message, long timeout) {
                return true;
            }
        };

        SimpMessagingTemplate messagingTemplate = new SimpMessagingTemplate(channel) {
            @Override
            public void convertAndSend(String destination, Object payload) {
                sentDestinations.add(destination);
                sentPayloads.add(payload);
            }
        };

        presenceService = new UserPresenceService(messagingTemplate);
    }

    @Test
    void userConnects_broadcastsOnlineAndTracksUser() {
        assertFalse(presenceService.isUserOnline("Rupesh"));

        presenceService.onUserConnected("Rupesh", "sess-1");

        assertTrue(presenceService.isUserOnline("Rupesh"));
        assertTrue(presenceService.isUserOnline("rupesh")); // case-insensitive check
        assertEquals(1, sentDestinations.size());
        assertEquals("/topic/presence", sentDestinations.get(0));

        PresenceEventDto event = (PresenceEventDto) sentPayloads.get(0);
        assertEquals("Rupesh", event.getUsername());
        assertEquals("ONLINE", event.getStatus());

        Set<String> onlineUsers = presenceService.getOnlineUsers();
        assertTrue(onlineUsers.contains("Rupesh"));
    }

    @Test
    void multipleSessions_staysOnlineUntilAllSessionsClosed() {
        presenceService.onUserConnected("Alice", "sess-1");
        presenceService.onUserConnected("Alice", "sess-2");

        // Should only broadcast ONLINE once
        assertEquals(1, sentDestinations.size());
        assertTrue(presenceService.isUserOnline("Alice"));

        // Close first session
        presenceService.onUserDisconnected("sess-1");
        // Still online because sess-2 is active
        assertTrue(presenceService.isUserOnline("Alice"));
        assertEquals(1, sentDestinations.size()); // No OFFLINE broadcast yet

        // Close second session
        presenceService.onUserDisconnected("sess-2");
        assertFalse(presenceService.isUserOnline("Alice"));
        assertEquals(2, sentDestinations.size());

        PresenceEventDto offlineEvent = (PresenceEventDto) sentPayloads.get(1);
        assertEquals("Alice", offlineEvent.getUsername());
        assertEquals("OFFLINE", offlineEvent.getStatus());
    }

    @Test
    void unknownSessionDisconnect_doesNotThrowOrBroadcast() {
        presenceService.onUserDisconnected("non-existent-session");
        assertTrue(sentDestinations.isEmpty());
    }
}
