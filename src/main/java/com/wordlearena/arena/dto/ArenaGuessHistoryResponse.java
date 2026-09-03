package com.wordlearena.arena.dto;

import com.wordlearena.game.logic.LetterResult;

public class ArenaGuessHistoryResponse {

    private String guess;
    private LetterResult[] result;
    private int attemptNumber;

    public ArenaGuessHistoryResponse(
            String guess,
            LetterResult[] result,
            int attemptNumber
    ) {
        this.guess = guess;
        this.result = result;
        this.attemptNumber = attemptNumber;
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
}