package com.wordlearena.arena.controller;

import com.wordlearena.arena.dto.ArenaGuessRequest;
import com.wordlearena.arena.dto.ArenaGuessResponse;
import com.wordlearena.arena.dto.ArenaMatchDetailsResponse;
import com.wordlearena.arena.dto.ArenaMatchResponse;
import com.wordlearena.arena.service.ArenaService;
import com.wordlearena.user.entity.User;
import com.wordlearena.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/arena")
public class ArenaController {

    private final ArenaService arenaService;
    private final UserRepository userRepository;

    public ArenaController(
            ArenaService arenaService,
            UserRepository userRepository) {

        this.arenaService = arenaService;
        this.userRepository = userRepository;
    }

    /*
     * Find an existing waiting match or create
     * a new one.
     */
    @PostMapping("/match")
    public ResponseEntity<ArenaMatchResponse> findMatch(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                arenaService.findOrCreateMatch(user)
        );
    }

    /*
     * Get the current active Arena match for the authenticated user, if any.
     */
    @GetMapping("/active")
    public ResponseEntity<ArenaMatchResponse> getActiveMatch(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        return arenaService
                .findActiveMatch(user)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /*
     * Get the current state of an Arena match.
     */
    @GetMapping("/{matchId}")
    public ResponseEntity<ArenaMatchResponse> getMatch(
            @PathVariable Long matchId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                arenaService.getMatch(matchId, user)
        );
    }

    /*
     * Submit a guess for the current Arena match.
     */
    @PostMapping("/{matchId}/guesses")
    public ResponseEntity<ArenaGuessResponse> submitGuess(
            @PathVariable Long matchId,
            @Valid @RequestBody ArenaGuessRequest request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                arenaService.submitGuess(
                        matchId,
                        request.getGuess(),
                        user
                )
        );
    }

    /*
     * Cancel a match while it is still waiting
     * for an opponent.
     */
    @PostMapping("/{matchId}/cancel")
    public ResponseEntity<ArenaMatchResponse> cancelMatch(
            @PathVariable Long matchId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                arenaService.cancelMatch(
                        matchId,
                        user
                )
        );
    }

    /*
     * Forfeit an in-progress match.
     * The forfeiting player loses and the opponent wins.
     */
    @PostMapping("/{matchId}/forfeit")
    public ResponseEntity<ArenaMatchResponse> forfeitMatch(
            @PathVariable Long matchId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                arenaService.forfeitMatch(
                        matchId,
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
                        ));
    }
    @GetMapping("/{matchId}/details")
    public ResponseEntity<ArenaMatchDetailsResponse> getMatchDetails(
            @PathVariable Long matchId,
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                arenaService.getMatchDetails(matchId, user)
        );
    }
}