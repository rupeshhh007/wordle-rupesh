package com.wordlearena.arena.dto;

public class ChallengeResponseRequest {
    private boolean accept;

    public ChallengeResponseRequest() {
    }

    public ChallengeResponseRequest(boolean accept) {
        this.accept = accept;
    }

    public boolean isAccept() {
        return accept;
    }

    public void setAccept(boolean accept) {
        this.accept = accept;
    }
}
