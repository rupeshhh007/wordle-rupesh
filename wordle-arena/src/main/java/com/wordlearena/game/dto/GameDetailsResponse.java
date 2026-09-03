package com.wordlearena.game.dto;

import com.wordlearena.game.entity.GameStatus;
import com.wordlearena.game.entity.GameType;

import java.time.LocalDateTime;
import java.util.List;

public class GameDetailsResponse {

    private Long id;
    private GameType gameType;
    private GameStatus status;
    private Integer attemptCount;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private List<GuessResponse> guesses;

    public GameDetailsResponse(
            Long id,
            GameType gameType,
            GameStatus status,
            Integer attemptCount,
            LocalDateTime startedAt,
            LocalDateTime completedAt,
            List<GuessResponse> guesses) {

        this.id = id;
        this.gameType = gameType;
        this.status = status;
        this.attemptCount = attemptCount;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.guesses = guesses;
    }

    public Long getId() {
        return id;
    }

    public GameType getGameType() {
        return gameType;
    }

    public GameStatus getStatus() {
        return status;
    }

    public Integer getAttemptCount() {
        return attemptCount;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public List<GuessResponse> getGuesses() {
        return guesses;
    }
}