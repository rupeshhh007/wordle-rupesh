package com.wordlearena.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresenceEventDto {
    private String username;
    private String status; // "ONLINE" or "OFFLINE"
    private long timestamp;
}
