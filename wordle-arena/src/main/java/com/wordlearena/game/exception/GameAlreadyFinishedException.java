package com.wordlearena.game.exception;

public class GameAlreadyFinishedException extends RuntimeException {

    public GameAlreadyFinishedException(String message) {
        super(message);
    }
}