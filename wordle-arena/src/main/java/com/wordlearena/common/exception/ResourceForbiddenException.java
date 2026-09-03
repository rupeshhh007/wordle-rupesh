package com.wordlearena.common.exception;

public class ResourceForbiddenException extends RuntimeException {

    public ResourceForbiddenException(String message) {
        super(message);
    }
}