package com.wordlearena.arena.dto;

import com.wordlearena.arena.entity.ArenaMatchStatus;
import com.wordlearena.arena.entity.ArenaWinner;

import java.time.LocalDateTime;

public class ArenaMatchResponse {

    private Long id;
    private String player1;
    private String player2;
    private ArenaMatchStatus status;
    private ArenaWinner winner;
    private int player1Attempts;
    private int player2Attempts;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private boolean isPrivate;
    private String inviteCode;

    public ArenaMatchResponse(
            Long id,
            String player1,
            String player2,
            ArenaMatchStatus status,
            ArenaWinner winner,
            int player1Attempts,
            int player2Attempts,
            LocalDateTime createdAt,
            LocalDateTime startedAt,
            LocalDateTime completedAt
    ) {
        this(id, player1, player2, status, winner, player1Attempts, player2Attempts, createdAt, startedAt, completedAt, false, null);
    }

    public ArenaMatchResponse(
            Long id,
            String player1,
            String player2,
            ArenaMatchStatus status,
            ArenaWinner winner,
            int player1Attempts,
            int player2Attempts,
            LocalDateTime createdAt,
            LocalDateTime startedAt,
            LocalDateTime completedAt,
            boolean isPrivate,
            String inviteCode
    ) {
        this.id = id;
        this.player1 = player1;
        this.player2 = player2;
        this.status = status;
        this.winner = winner;
        this.player1Attempts = player1Attempts;
        this.player2Attempts = player2Attempts;
        this.createdAt = createdAt;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.isPrivate = isPrivate;
        this.inviteCode = inviteCode;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public boolean isPrivate() {
        return isPrivate;
    }

    public String getInviteCode() {
        return inviteCode;
    }
}