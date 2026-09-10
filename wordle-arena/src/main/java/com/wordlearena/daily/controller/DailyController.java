package com.wordlearena.daily.controller;

import com.wordlearena.daily.dto.DailyGuessRequest;
import com.wordlearena.daily.service.DailyService;
import com.wordlearena.game.dto.GameDetailsResponse;
import com.wordlearena.game.dto.GameResponse;
import com.wordlearena.game.dto.GuessResponse;
import com.wordlearena.game.entity.Game;
import com.wordlearena.game.entity.GameStatus;
import com.wordlearena.game.service.GameService;
import com.wordlearena.user.entity.User;
import com.wordlearena.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/daily")
public class DailyController {

    private final DailyService dailyService;
    private final GameService gameService;
    private final UserRepository userRepository;

    public DailyController(
            DailyService dailyService,
            GameService gameService,
            UserRepository userRepository) {

        this.dailyService = dailyService;
        this.gameService = gameService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<GameResponse> getDailyGame(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        Game game =
                dailyService.getOrCreateDailyGame(user);

        boolean isFinished = game.getStatus() == GameStatus.WON || game.getStatus() == GameStatus.LOST || game.getStatus() == GameStatus.ABANDONED;
        String solutionWord = isFinished && game.getWord() != null ? game.getWord().getWord() : null;

        GameResponse response = new GameResponse(
                game.getId(),
                game.getGameType(),
                game.getStatus(),
                game.getAttemptCount(),
                game.getStartedAt(),
                null,
                solutionWord
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/guesses")
    public ResponseEntity<GuessResponse> submitDailyGuess(
            @Valid @RequestBody DailyGuessRequest request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        Game game =
                dailyService.getOrCreateDailyGame(user);

        GuessResponse response =
                gameService.submitGuess(
                        game.getId(),
                        request.getGuess(),
                        user
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/result")
    public ResponseEntity<GameDetailsResponse> getDailyResult(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        Game game =
                dailyService.getOrCreateDailyGame(user);

        return ResponseEntity.ok(
                gameService.getGame(
                        game.getId(),
                        user
                )
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
}