package com.wordlearena.game.exception;

public class InvalidGuessException extends RuntimeException {

    public InvalidGuessException(String message) {
        super(message);
    }
}