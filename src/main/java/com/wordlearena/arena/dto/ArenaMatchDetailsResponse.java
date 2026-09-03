package com.wordlearena.arena.dto;

import com.wordlearena.arena.entity.ArenaMatchStatus;
import com.wordlearena.arena.entity.ArenaWinner;

import java.time.LocalDateTime;
import java.util.List;

public class ArenaMatchDetailsResponse {

    private Long id;

    private String player1;
    private String player2;

    private ArenaMatchStatus status;
    private ArenaWinner winner;

    private int player1Attempts;
    private int player2Attempts;

    private List<ArenaGuessHistoryResponse> player1Guesses;
    private List<ArenaGuessHistoryResponse> player2Guesses;

    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    public ArenaMatchDetailsResponse(
            Long id,
            String player1,
            String player2,
            ArenaMatchStatus status,
            ArenaWinner winner,
            int player1Attempts,
            int player2Attempts,
            List<ArenaGuessHistoryResponse> player1Guesses,
            List<ArenaGuessHistoryResponse> player2Guesses,
            LocalDateTime createdAt,
            LocalDateTime startedAt,
            LocalDateTime completedAt
    ) {
        this.id = id;
        this.player1 = player1;
        this.player2 = player2;
        this.status = status;
        this.winner = winner;
        this.player1Attempts = player1Attempts;
        this.player2Attempts = player2Attempts;
        this.player1Guesses = player1Guesses;
        this.player2Guesses = player2Guesses;
        this.createdAt = createdAt;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
    }

    public Long getId() {
        return id;
    }

    public String getPlayer1() {
        return player1;
    }

    public String getPlayer2() {
        return player2;
    }

    public ArenaMatchStatus getStatus() {
        return status;
    }

    public ArenaWinner getWinner() {
        return winner;
    }

    public int getPlayer1Attempts() {
        return player1Attempts;
    }

    public int getPlayer2Attempts() {
        return player2Attempts;
    }

    public List<ArenaGuessHistoryResponse> getPlayer1Guesses() {
        return player1Guesses;
    }

    public List<ArenaGuessHistoryResponse> getPlayer2Guesses() {
        return player2Guesses;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
}