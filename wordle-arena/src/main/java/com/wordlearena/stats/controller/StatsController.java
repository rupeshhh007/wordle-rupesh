package com.wordlearena.stats.controller;

import com.wordlearena.stats.dto.StatsResponse;
import com.wordlearena.stats.service.StatsService;
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
public class StatsController {

    private final StatsService statsService;
    private final UserRepository userRepository;

    public StatsController(
            StatsService statsService,
            UserRepository userRepository) {

        this.statsService = statsService;
        this.userRepository = userRepository;
    }

    @GetMapping("/me/stats")
    public ResponseEntity<StatsResponse> getStats(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                statsService.getStats(user)
        );
    }

    @GetMapping("/{username}/stats")
    public ResponseEntity<StatsResponse> getUserStats(
            @PathVariable String username) {

        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new UserNotFoundException("User not found: " + username)
                );

        return ResponseEntity.ok(
                statsService.getStats(user)
        );
    }

    private User getAuthenticatedUser(Authentication authentication) {

        return userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new UserNotFoundException(
                                "Authenticated user not found"
                        )
                );
    }
}