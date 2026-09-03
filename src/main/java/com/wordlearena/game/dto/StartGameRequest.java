package com.wordlearena.game.dto;

import com.wordlearena.game.entity.GameType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class StartGameRequest {

    @NotNull
    private GameType gameType;

    public void setGameType(GameType gameType) {
        this.gameType = gameType;
    }
}