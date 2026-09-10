package com.wordlearena.arena.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("isPrivate")
    private boolean isPrivate;

    @JsonProperty("inviteCode")
    private String inviteCode;

    @JsonProperty("rematchRequestedByPlayer1")
    private boolean rematchRequestedByPlayer1;

    @JsonProperty("rematchRequestedByPlayer2")
    private boolean rematchRequestedByPlayer2;

    @JsonProperty("nextMatchId")
    private Long nextMatchId;

    @JsonProperty("word")
    private String word;

    @JsonProperty("timeLimitSeconds")
    private int timeLimitSeconds = 180;

    @JsonProperty("remainingSeconds")
    private int remainingSeconds;

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
        this(id, player1, player2, status, winner, player1Attempts, player2Attempts, player1Guesses, player2Guesses, createdAt, startedAt, completedAt, false, null, false, false, null, null);
    }

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
            LocalDateTime completedAt,
            boolean isPrivate,
            String inviteCode
    ) {
        this(id, player1, player2, status, winner, player1Attempts, player2Attempts, player1Guesses, player2Guesses, createdAt, startedAt, completedAt, isPrivate, inviteCode, false, false, null, null);
    }

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
            LocalDateTime completedAt,
            boolean isPrivate,
            String inviteCode,
            boolean rematchRequestedByPlayer1,
            boolean rematchRequestedByPlayer2,
            Long nextMatchId
    ) {
        this(id, player1, player2, status, winner, player1Attempts, player2Attempts, player1Guesses, player2Guesses, createdAt, startedAt, completedAt, isPrivate, inviteCode, rematchRequestedByPlayer1, rematchRequestedByPlayer2, nextMatchId, null);
    }

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
            LocalDateTime completedAt,
            boolean isPrivate,
            String inviteCode,
            boolean rematchRequestedByPlayer1,
            boolean rematchRequestedByPlayer2,
            Long nextMatchId,
            String word
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
        this.isPrivate = isPrivate;
        this.inviteCode = inviteCode;
        this.rematchRequestedByPlayer1 = rematchRequestedByPlayer1;
        this.rematchRequestedByPlayer2 = rematchRequestedByPlayer2;
        this.nextMatchId = nextMatchId;
        this.word = word;
    }

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
            LocalDateTime completedAt,
            boolean isPrivate,
            String inviteCode,
            boolean rematchRequestedByPlayer1,
            boolean rematchRequestedByPlayer2,
            Long nextMatchId,
            String word,
            int timeLimitSeconds,
            int remainingSeconds
    ) {
        this(id, player1, player2, status, winner, player1Attempts, player2Attempts, player1Guesses, player2Guesses, createdAt, startedAt, completedAt, isPrivate, inviteCode, rematchRequestedByPlayer1, rematchRequestedByPlayer2, nextMatchId, word);
        this.timeLimitSeconds = timeLimitSeconds;
        this.remainingSeconds = remainingSeconds;
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

    @JsonProperty("isPrivate")
    public boolean isPrivate() {
        return isPrivate;
    }

    @JsonProperty("isPrivate")
    public boolean getIsPrivate() {
        return isPrivate;
    }

    @JsonProperty("inviteCode")
    public String getInviteCode() {
        return inviteCode;
    }

    @JsonProperty("rematchRequestedByPlayer1")
    public boolean isRematchRequestedByPlayer1() {
        return rematchRequestedByPlayer1;
    }

    @JsonProperty("rematchRequestedByPlayer2")
    public boolean isRematchRequestedByPlayer2() {
        return rematchRequestedByPlayer2;
    }

    @JsonProperty("nextMatchId")
    public Long getNextMatchId() {
        return nextMatchId;
    }

    @JsonProperty("word")
    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public int getTimeLimitSeconds() {
        return timeLimitSeconds;
    }

    public void setTimeLimitSeconds(int timeLimitSeconds) {
        this.timeLimitSeconds = timeLimitSeconds;
    }

    public int getRemainingSeconds() {
        return remainingSeconds;
    }

    public void setRemainingSeconds(int remainingSeconds) {
        this.remainingSeconds = remainingSeconds;
    }
}