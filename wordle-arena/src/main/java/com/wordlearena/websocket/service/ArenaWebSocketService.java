package com.wordlearena.websocket.service;

import com.wordlearena.arena.dto.ArenaMatchResponse;
import com.wordlearena.game.logic.LetterResult;
import com.wordlearena.websocket.dto.ChallengeEventDto;
import com.wordlearena.websocket.dto.MatchEventDto;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ArenaWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public ArenaWebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Broadcasts a real-time event to all participants and spectators of an Arena match.
     */
    public void broadcastMatchEvent(Long matchId, MatchEventDto event) {
        if (matchId == null || event == null) return;
        try {
            messagingTemplate.convertAndSend("/topic/match/" + matchId, event);
        } catch (Exception e) {
            System.err.println("Failed to broadcast match event for match " + matchId + ": " + e.getMessage());
        }
    }

    /**
     * Helper to broadcast a typed match update.
     */
    public void broadcastMatchUpdate(
            Long matchId,
            String eventType,
            ArenaMatchResponse match,
            String player,
            Integer attempts,
            List<LetterResult> lastEvaluation,
            String message) {

        MatchEventDto event = MatchEventDto.builder()
                .eventType(eventType)
                .matchId(matchId)
                .match(match)
                .player(player)
                .playerAttempts(attempts)
                .lastGuessEvaluation(lastEvaluation)
                .message(message)
                .timestamp(System.currentTimeMillis())
                .build();

        broadcastMatchEvent(matchId, event);
    }

    /**
     * Helper to broadcast that a player has left the lobby.
     */
    public void broadcastPlayerLeftLobby(Long matchId, String username, ArenaMatchResponse match) {
        broadcastMatchUpdate(
                matchId,
                "PLAYER_LEFT_LOBBY",
                match,
                username,
                null,
                null,
                username + " left the lobby"
        );
    }

    /**
     * Sends a direct 1v1 challenge notification to a user.
     */
    public void sendChallenge(String targetUsername, ChallengeEventDto challenge) {
        if (targetUsername == null || challenge == null) return;
        try {
            // Send to user destination (/user/{targetUsername}/queue/challenges)
            messagingTemplate.convertAndSendToUser(targetUsername, "/queue/challenges", challenge);
            // Also send to topic destination for fallback (/topic/user/{targetUsername}/challenges)
            messagingTemplate.convertAndSend("/topic/user/" + targetUsername + "/challenges", challenge);
        } catch (Exception e) {
            System.err.println("Failed to send challenge notification to " + targetUsername + ": " + e.getMessage());
        }
    }

    /**
     * Sends a challenge response (accepted / declined / cancelled) to a user.
     */
    public void sendChallengeResponse(String targetUsername, ChallengeEventDto response) {
        if (targetUsername == null || response == null) return;
        try {
            messagingTemplate.convertAndSendToUser(targetUsername, "/queue/challenges", response);
            messagingTemplate.convertAndSend("/topic/user/" + targetUsername + "/challenges", response);
        } catch (Exception e) {
            System.err.println("Failed to send challenge response to " + targetUsername + ": " + e.getMessage());
        }
    }
}
