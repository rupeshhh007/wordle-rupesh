package com.wordlearena.game.dto;

import com.wordlearena.game.entity.GameType;
import jakarta.validation.constraints.NotNull;

public class StartGameRequest {

    @NotNull
    private GameType gameType;

    public GameType getGameType() {
        return gameType;
    }

    public void setGameType(GameType gameType) {
        this.gameType = gameType;
    }
}