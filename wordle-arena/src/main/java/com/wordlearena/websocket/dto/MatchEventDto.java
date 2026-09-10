package com.wordlearena.websocket.dto;

import com.wordlearena.arena.dto.ArenaMatchResponse;
import com.wordlearena.game.logic.LetterResult;

import java.util.List;

public class MatchEventDto {

    private String eventType;
    private Long matchId;
    private ArenaMatchResponse match;
    private String player;
    private Integer playerAttempts;
    private List<LetterResult> lastGuessEvaluation;
    private String message;
    private Long timestamp;

    public MatchEventDto() {
    }

    public MatchEventDto(String eventType, Long matchId, ArenaMatchResponse match, String player, Integer playerAttempts, List<LetterResult> lastGuessEvaluation, String message, Long timestamp) {
        this.eventType = eventType;
        this.matchId = matchId;
        this.match = match;
        this.player = player;
        this.playerAttempts = playerAttempts;
        this.lastGuessEvaluation = lastGuessEvaluation;
        this.message = message;
        this.timestamp = timestamp;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String eventType;
        private Long matchId;
        private ArenaMatchResponse match;
        private String player;
        private Integer playerAttempts;
        private List<LetterResult> lastGuessEvaluation;
        private String message;
        private Long timestamp;

        public Builder eventType(String eventType) {
            this.eventType = eventType;
            return this;
        }

        public Builder matchId(Long matchId) {
            this.matchId = matchId;
            return this;
        }

        public Builder match(ArenaMatchResponse match) {
            this.match = match;
            return this;
        }

        public Builder player(String player) {
            this.player = player;
            return this;
        }

        public Builder playerAttempts(Integer playerAttempts) {
            this.playerAttempts = playerAttempts;
            return this;
        }

        public Builder lastGuessEvaluation(List<LetterResult> lastGuessEvaluation) {
            this.lastGuessEvaluation = lastGuessEvaluation;
            return this;
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public Builder timestamp(Long timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public MatchEventDto build() {
            return new MatchEventDto(eventType, matchId, match, player, playerAttempts, lastGuessEvaluation, message, timestamp);
        }
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Long getMatchId() {
        return matchId;
    }

    public void setMatchId(Long matchId) {
        this.matchId = matchId;
    }

    public ArenaMatchResponse getMatch() {
        return match;
    }

    public void setMatch(ArenaMatchResponse match) {
        this.match = match;
    }

    public String getPlayer() {
        return player;
    }

    public void setPlayer(String player) {
        this.player = player;
    }

    public Integer getPlayerAttempts() {
        return playerAttempts;
    }

    public void setPlayerAttempts(Integer playerAttempts) {
        this.playerAttempts = playerAttempts;
    }

    public List<LetterResult> getLastGuessEvaluation() {
        return lastGuessEvaluation;
    }

    public void setLastGuessEvaluation(List<LetterResult> lastGuessEvaluation) {
        this.lastGuessEvaluation = lastGuessEvaluation;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }
}
