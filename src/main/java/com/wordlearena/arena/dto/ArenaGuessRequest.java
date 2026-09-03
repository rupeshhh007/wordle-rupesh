package com.wordlearena.arena.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ArenaGuessRequest {

    @NotBlank(message = "Guess cannot be blank")
    @Size(
            min = 5,
            max = 5,
            message = "Guess must contain exactly 5 letters"
    )
    @Pattern(
            regexp = "^[a-zA-Z]{5}$",
            message = "Guess must contain only letters"
    )
    private String guess;

    public String getGuess() {
        return guess;
    }

    public void setGuess(String guess) {
        this.guess = guess;
    }
}