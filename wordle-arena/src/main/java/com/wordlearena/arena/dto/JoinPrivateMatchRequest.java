package com.wordlearena.arena.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class JoinPrivateMatchRequest {

    @NotBlank(message = "Invite code cannot be blank")
    @Size(min = 4, max = 16, message = "Invite code must be between 4 and 16 characters")
    private String inviteCode;

    public JoinPrivateMatchRequest() {
    }

    public JoinPrivateMatchRequest(String inviteCode) {
        this.inviteCode = inviteCode;
    }

    public String getInviteCode() {
        return inviteCode;
    }

    public void setInviteCode(String inviteCode) {
        this.inviteCode = inviteCode;
    }
}
