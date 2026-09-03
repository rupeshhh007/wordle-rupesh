package com.wordlearena.leaderboard.controller;

import com.wordlearena.leaderboard.dto.LeaderboardEntryResponse;
import com.wordlearena.leaderboard.dto.MyLeaderboardResponse;
import com.wordlearena.leaderboard.service.LeaderboardService;
import com.wordlearena.user.entity.User;
import com.wordlearena.user.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final UserRepository userRepository;

    public LeaderboardController(
            LeaderboardService leaderboardService,
            UserRepository userRepository
    ) {
        this.leaderboardService = leaderboardService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<LeaderboardEntryResponse>>
    getLeaderboard() {

        return ResponseEntity.ok(
                leaderboardService.getLeaderboard()
        );
    }

    @GetMapping("/me")
    public ResponseEntity<MyLeaderboardResponse>
    getMyRank(Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                leaderboardService.getMyRank(user)
        );
    }

    private User getAuthenticatedUser(
            Authentication authentication
    ) {

        return userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Authenticated user not found"
                        )
                );
    }
}