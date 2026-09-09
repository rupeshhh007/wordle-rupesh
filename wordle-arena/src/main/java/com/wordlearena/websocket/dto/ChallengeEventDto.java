package com.wordlearena.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeEventDto {

    private String type;
    private String challenger;
    private Integer challengerRating;
    private String targetUser;
    private Long matchId;
    private String inviteCode;
    private String message;
    private Long timestamp;
}
