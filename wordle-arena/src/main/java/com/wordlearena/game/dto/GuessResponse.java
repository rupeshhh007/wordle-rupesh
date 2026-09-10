package com.wordlearena.game.dto;

import com.wordlearena.game.entity.GameStatus;
import com.wordlearena.game.logic.LetterResult;

public class GuessResponse {

    private String guess;
    private LetterResult[] result;
    private Integer attemptNumber;
    private GameStatus gameStatus;
    private String word;

    public GuessResponse(
            String guess,
            LetterResult[] result,
            Integer attemptNumber,
            GameStatus gameStatus) {
        this(guess, result, attemptNumber, gameStatus, null);
    }

    public GuessResponse(
            String guess,
            LetterResult[] result,
            Integer attemptNumber,
            GameStatus gameStatus,
            String word) {

        this.guess = guess;
        this.result = result;
        this.attemptNumber = attemptNumber;
        this.gameStatus = gameStatus;
        this.word = word;
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

    public String getWord() {
        return word;
    }
}