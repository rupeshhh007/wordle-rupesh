package com.wordlearena.websocket.dto;

import com.wordlearena.arena.dto.ArenaMatchResponse;
import com.wordlearena.game.logic.LetterResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchEventDto {

    private String eventType;
    private Long matchId;
    private ArenaMatchResponse match;
    private String player;
    private Integer playerAttempts;
    private List<LetterResult> lastGuessEvaluation;
    private String message;
    private Long timestamp;
}
