package com.wordlearena.websocket.dto;

public class ChallengeEventDto {

    private String type;
    private String challenger;
    private Integer challengerRating;
    private String targetUser;
    private Long matchId;
    private String inviteCode;
    private String message;
    private Long timestamp;

    public ChallengeEventDto() {
    }

    public ChallengeEventDto(String type, String challenger, Integer challengerRating, String targetUser, Long matchId, String inviteCode, String message, Long timestamp) {
        this.type = type;
        this.challenger = challenger;
        this.challengerRating = challengerRating;
        this.targetUser = targetUser;
        this.matchId = matchId;
        this.inviteCode = inviteCode;
        this.message = message;
        this.timestamp = timestamp;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String type;
        private String challenger;
        private Integer challengerRating;
        private String targetUser;
        private Long matchId;
        private String inviteCode;
        private String message;
        private Long timestamp;

        public Builder type(String type) {
            this.type = type;
            return this;
        }

        public Builder challenger(String challenger) {
            this.challenger = challenger;
            return this;
        }

        public Builder challengerRating(Integer challengerRating) {
            this.challengerRating = challengerRating;
            return this;
        }

        public Builder targetUser(String targetUser) {
            this.targetUser = targetUser;
            return this;
        }

        public Builder matchId(Long matchId) {
            this.matchId = matchId;
            return this;
        }

        public Builder inviteCode(String inviteCode) {
            this.inviteCode = inviteCode;
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

        public ChallengeEventDto build() {
            return new ChallengeEventDto(type, challenger, challengerRating, targetUser, matchId, inviteCode, message, timestamp);
        }
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getChallenger() {
        return challenger;
    }

    public void setChallenger(String challenger) {
        this.challenger = challenger;
    }

    public Integer getChallengerRating() {
        return challengerRating;
    }

    public void setChallengerRating(Integer challengerRating) {
        this.challengerRating = challengerRating;
    }

    public String getTargetUser() {
        return targetUser;
    }

    public void setTargetUser(String targetUser) {
        this.targetUser = targetUser;
    }

    public Long getMatchId() {
        return matchId;
    }

    public void setMatchId(Long matchId) {
        this.matchId = matchId;
    }

    public String getInviteCode() {
        return inviteCode;
    }

    public void setInviteCode(String inviteCode) {
        this.inviteCode = inviteCode;
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
