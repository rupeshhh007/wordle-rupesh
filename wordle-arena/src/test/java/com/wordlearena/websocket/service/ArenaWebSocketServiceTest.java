package com.wordlearena.websocket.service;

import com.wordlearena.arena.dto.ArenaMatchResponse;
import com.wordlearena.arena.entity.ArenaMatchStatus;
import com.wordlearena.websocket.dto.ChallengeEventDto;
import com.wordlearena.websocket.dto.MatchEventDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ArenaWebSocketServiceTest {

    private SimpMessagingTemplate messagingTemplate;
    private ArenaWebSocketService webSocketService;

    private final List<String> sentDestinations = new ArrayList<>();
    private final List<Object> sentPayloads = new ArrayList<>();

    @BeforeEach
    void setUp() {
        sentDestinations.clear();
        sentPayloads.clear();

        org.springframework.messaging.MessageChannel channel = new org.springframework.messaging.MessageChannel() {
            @Override
            public boolean send(org.springframework.messaging.Message<?> message) {
                return true;
            }

            @Override
            public boolean send(org.springframework.messaging.Message<?> message, long timeout) {
                return true;
            }
        };

        messagingTemplate = new SimpMessagingTemplate(channel) {
            @Override
            public void convertAndSend(String destination, Object payload) {
                sentDestinations.add(destination);
                sentPayloads.add(payload);
            }

            @Override
            public void convertAndSendToUser(String user, String destination, Object payload) {
                sentDestinations.add("/user/" + user + destination);
                sentPayloads.add(payload);
            }
        };

        webSocketService = new ArenaWebSocketService(messagingTemplate);
    }

    @Test
    void broadcastMatchUpdate_sendsToTopicMatch() {
        ArenaMatchResponse match = new ArenaMatchResponse(
                101L, "player1", "player2", ArenaMatchStatus.IN_PROGRESS, null, 2, 1,
                null, null, null
        );

        webSocketService.broadcastMatchUpdate(
                101L,
                "GUESS_SUBMITTED",
                match,
                "player1",
                2,
                null,
                "New guess"
        );

        assertEquals(1, sentDestinations.size());
        assertEquals("/topic/match/101", sentDestinations.get(0));
        assertTrue(sentPayloads.get(0) instanceof MatchEventDto);
        MatchEventDto event = (MatchEventDto) sentPayloads.get(0);
        assertEquals("GUESS_SUBMITTED", event.getEventType());
        assertEquals(101L, event.getMatchId());
        assertEquals("player1", event.getPlayer());
        assertEquals(2, event.getPlayerAttempts());
    }

    @Test
    void broadcastPlayerLeftLobby_sendsPlayerLeftLobbyEvent() {
        ArenaMatchResponse match = new ArenaMatchResponse(
                102L, "player1", "player2", ArenaMatchStatus.PLAYER1_WON, null, 3, 4,
                null, null, null
        );

        webSocketService.broadcastPlayerLeftLobby(102L, "player2", match);

        assertEquals(1, sentDestinations.size());
        assertEquals("/topic/match/102", sentDestinations.get(0));
        MatchEventDto event = (MatchEventDto) sentPayloads.get(0);
        assertEquals("PLAYER_LEFT_LOBBY", event.getEventType());
        assertEquals("player2", event.getPlayer());
        assertTrue(event.getMessage().contains("player2 left the lobby"));
    }

    @Test
    void sendChallenge_sendsToUserQueueAndTopicFallback() {
        ChallengeEventDto challenge = ChallengeEventDto.builder()
                .type("CHALLENGE_RECEIVED")
                .challenger("alice")
                .targetUser("bob")
                .matchId(200L)
                .inviteCode("K7X9W2")
                .build();

        webSocketService.sendChallenge("bob", challenge);

        assertEquals(2, sentDestinations.size());
        assertEquals("/user/bob/queue/challenges", sentDestinations.get(0));
        assertEquals("/topic/user/bob/challenges", sentDestinations.get(1));
    }
}
