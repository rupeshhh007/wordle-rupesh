package com.wordlearena.websocket.dto;

public class PresenceEventDto {
    private String username;
    private String status; // "ONLINE" or "OFFLINE"
    private long timestamp;

    public PresenceEventDto() {
    }

    public PresenceEventDto(String username, String status, long timestamp) {
        this.username = username;
        this.status = status;
        this.timestamp = timestamp;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String username;
        private String status;
        private long timestamp;

        public Builder username(String username) {
            this.username = username;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder timestamp(long timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public PresenceEventDto build() {
            return new PresenceEventDto(username, status, timestamp);
        }
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}
