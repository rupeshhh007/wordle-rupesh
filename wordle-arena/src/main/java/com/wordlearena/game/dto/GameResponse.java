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
    private String word;

    public GameResponse(
            Long id,
            GameType gameType,
            GameStatus status,
            Integer attemptCount,
            LocalDateTime startedAt
    ) {
        this(id, gameType, status, attemptCount, startedAt, null, null);
    }

    public GameResponse(
            Long id,
            GameType gameType,
            GameStatus status,
            Integer attemptCount,
            LocalDateTime startedAt,
            String opponentUsername
    ) {
        this(id, gameType, status, attemptCount, startedAt, opponentUsername, null);
    }

    public GameResponse(
            Long id,
            GameType gameType,
            GameStatus status,
            Integer attemptCount,
            LocalDateTime startedAt,
            String opponentUsername,
            String word
    ) {
        this.id = id;
        this.gameType = gameType;
        this.status = status;
        this.attemptCount = attemptCount;
        this.startedAt = startedAt;
        this.opponentUsername = opponentUsername;
        this.word = word;
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

    public String getWord() {
        return word;
    }
}