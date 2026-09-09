package com.wordlearena.arena.controller;

import com.wordlearena.arena.dto.ArenaMatchResponse;
import com.wordlearena.arena.dto.ChallengeResponseRequest;
import com.wordlearena.arena.service.ArenaService;
import com.wordlearena.user.entity.User;
import com.wordlearena.user.repository.UserRepository;
import com.wordlearena.websocket.dto.ChallengeEventDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/arena/challenge")
public class ChallengeController {

    private final ArenaService arenaService;
    private final UserRepository userRepository;

    public ChallengeController(
            ArenaService arenaService,
            UserRepository userRepository) {
        this.arenaService = arenaService;
        this.userRepository = userRepository;
    }

    @GetMapping("/pending")
    public ResponseEntity<List<ChallengeEventDto>> getPendingChallenges(
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(
                arenaService.getPendingChallengesForUser(user)
        );
    }

    @PostMapping("/{targetUsername}")
    public ResponseEntity<ArenaMatchResponse> challengeUser(
            @PathVariable String targetUsername,
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(
                arenaService.challengeUser(targetUsername, user)
        );
    }

    @PostMapping("/{matchId}/respond")
    public ResponseEntity<ArenaMatchResponse> respondToChallenge(
            @PathVariable Long matchId,
            @RequestBody ChallengeResponseRequest request,
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(
                arenaService.respondToChallenge(matchId, request.isAccept(), user)
        );
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
    }
}
