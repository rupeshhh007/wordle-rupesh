package com.wordlearena.game.controller;

import com.wordlearena.game.dto.*;
import com.wordlearena.game.entity.Game;
import com.wordlearena.game.service.GameService;
import com.wordlearena.user.entity.User;
import com.wordlearena.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;
    private final UserRepository userRepository;

    public GameController(
            GameService gameService,
            UserRepository userRepository
    ) {
        this.gameService = gameService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<GameResponse> startGame(
            @Valid @RequestBody StartGameRequest request,
            Authentication authentication) {

        User user =
                getAuthenticatedUser(authentication);

        Game game =
                gameService.startGame(
                        user,
                        request.getGameType()
                );

        GameResponse response =
                new GameResponse(
                        game.getId(),
                        game.getGameType(),
                        game.getStatus(),
                        game.getAttemptCount(),
                        game.getStartedAt()
                );

        return ResponseEntity.ok(response);
    }
    @PostMapping("/{gameId}/guesses")
    public ResponseEntity<GuessResponse> submitGuess(
            @PathVariable Long gameId,
            @Valid @RequestBody GuessRequest request,
            Authentication authentication) {

        User user =
                getAuthenticatedUser(authentication);

        GuessResponse response =
                gameService.submitGuess(
                        gameId,
                        request.getGuess(),
                        user
                );

        return ResponseEntity.ok(response);
    }
    @GetMapping("/{gameId}")
    public ResponseEntity<GameDetailsResponse> getGame(
            @PathVariable Long gameId,
            Authentication authentication) {

        User user =
                getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                gameService.getGame(gameId, user)
        );
    }
    private User getAuthenticatedUser(
            Authentication authentication) {

        return userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Authenticated user not found"
                        )
                );
    }
    @GetMapping
    public ResponseEntity<List<GameResponse>> getUserGames(
            Authentication authentication) {

        User user =
                getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                gameService.getUserGames(user)
        );
    }
    @PostMapping("/{gameId}/abandon")
    public ResponseEntity<GameResponse> abandonGame(
            @PathVariable Long gameId,
            Authentication authentication) {

        User user =
                getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                gameService.abandonGame(
                        gameId,
                        user
                )
        );
    }
}