package com.wordlearena.user.controller;

import com.wordlearena.auth.dto.UserResponse;
import com.wordlearena.leaderboard.service.LeaderboardService;
import com.wordlearena.user.dto.PublicUserProfileResponse;
import com.wordlearena.user.entity.User;
import com.wordlearena.user.exception.UserNotFoundException;
import com.wordlearena.user.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final LeaderboardService leaderboardService;

    public UserController(
            UserRepository userRepository,
            LeaderboardService leaderboardService) {
        this.userRepository = userRepository;
        this.leaderboardService = leaderboardService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(
            Authentication authentication) {

        String username = authentication.getName();

        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new UserNotFoundException("User not found")
                );

        UserResponse response = new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRating()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{username}")
    public ResponseEntity<PublicUserProfileResponse> getPublicProfile(
            @PathVariable String username) {

        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new UserNotFoundException("User not found: " + username)
                );

        int rank = leaderboardService.getUserRank(user);

        PublicUserProfileResponse response = new PublicUserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getRating(),
                rank
        );

        return ResponseEntity.ok(response);
    }
}