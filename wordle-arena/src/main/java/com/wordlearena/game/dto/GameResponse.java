package com.wordlearena.game.dto;

import com.wordlearena.game.entity.GameStatus;
import com.wordlearena.game.entity.GameType;

import java.time.LocalDateTime;

public class GameResponse {

    private Long id;
    private GameType gameType;
    private GameStatus status;
    private Integer attemptCount;
    private LocalDateTime startedAt;
    private String opponentUsername;

    public GameResponse(
            Long id,
            GameType gameType,
            GameStatus status,
            Integer attemptCount,
            LocalDateTime startedAt
    ) {
        this(id, gameType, status, attemptCount, startedAt, null);
    }

    public GameResponse(
            Long id,
            GameType gameType,
            GameStatus status,
            Integer attemptCount,
            LocalDateTime startedAt,
            String opponentUsername
    ) {
        this.id = id;
        this.gameType = gameType;
        this.status = status;
        this.attemptCount = attemptCount;
        this.startedAt = startedAt;
        this.opponentUsername = opponentUsername;
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

    public String getOpponentUsername() {
        return opponentUsername;
    }
}