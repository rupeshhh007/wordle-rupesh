package com.wordlearena.arena.dto;

import com.wordlearena.arena.entity.ArenaMatchStatus;
import com.wordlearena.game.logic.LetterResult;

public class ArenaGuessResponse {

    private String guess;
    private LetterResult[] result;
    private int attemptNumber;
    private ArenaMatchStatus matchStatus;

    public ArenaGuessResponse(
            String guess,
            LetterResult[] result,
            int attemptNumber,
            ArenaMatchStatus matchStatus
    ) {
        this.guess = guess;
        this.result = result;
        this.attemptNumber = attemptNumber;
        this.matchStatus = matchStatus;
    }

    public String getGuess() {
        return guess;
    }

    public LetterResult[] getResult() {
        return result;
    }

    public int getAttemptNumber() {
        return attemptNumber;
    }

    public ArenaMatchStatus getMatchStatus() {
        return matchStatus;
    }
}