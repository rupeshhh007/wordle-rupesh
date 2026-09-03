package com.wordlearena.user.controller;

import com.wordlearena.user.entity.User;
import com.wordlearena.user.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping
    public User createUser(@RequestParam String username) {

        User user = new User();

        user.setUsername(username);
        user.setEmail(username + "@dev.local");
        user.setPasswordHash("DEV_ONLY");
        user.setRating(1000);

        return userRepository.save(user);
    }
}