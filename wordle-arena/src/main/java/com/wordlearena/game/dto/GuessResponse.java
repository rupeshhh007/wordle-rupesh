package com.wordlearena.game.dto;

import com.wordlearena.game.entity.GameStatus;
import com.wordlearena.game.logic.LetterResult;

public class GuessResponse {

    private String guess;
    private LetterResult[] result;
    private Integer attemptNumber;
    private GameStatus gameStatus;

    public GuessResponse(
            String guess,
            LetterResult[] result,
            Integer attemptNumber,
            GameStatus gameStatus) {

        this.guess = guess;
        this.result = result;
        this.attemptNumber = attemptNumber;
        this.gameStatus = gameStatus;
    }

    public String getGuess() {
        return guess;
    }

    public LetterResult[] getResult() {
        return result;
    }

    public Integer getAttemptNumber() {
        return attemptNumber;
    }

    public GameStatus getGameStatus() {
        return gameStatus;
    }
}