package com.wordlearena.auth.service;

import com.wordlearena.auth.dto.LoginRequest;
import com.wordlearena.auth.dto.LoginResponse;
import com.wordlearena.auth.dto.RegisterRequest;
import com.wordlearena.auth.dto.UserResponse;
import com.wordlearena.user.entity.User;
import com.wordlearena.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {

        String username = request.getUsername()
                .trim()
                .toLowerCase();

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException(
                    "Username is already taken"
            );
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "Email is already registered"
            );
        }

        User user = new User();

        user.setUsername(username);
        user.setEmail(email);

        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword())
        );

        user.setRating(1000);

        User savedUser =
                userRepository.save(user);

        return toResponse(savedUser);
    }

    public LoginResponse login(LoginRequest request) {

        String usernameOrEmail = request
                .getUsernameOrEmail()
                .trim()
                .toLowerCase();

        User user;

        if (usernameOrEmail.contains("@")) {

            user = userRepository
                    .findByEmail(usernameOrEmail)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Invalid credentials"
                            )
                    );

        } else {

            user = userRepository
                    .findByUsername(usernameOrEmail)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Invalid credentials"
                            )
                    );
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash())) {

            throw new IllegalArgumentException(
                    "Invalid credentials"
            );
        }

        UserDetails userDetails =
                org.springframework.security.core.userdetails.User
                        .withUsername(user.getUsername())
                        .password(user.getPasswordHash())
                        .roles("USER")
                        .build();

        String token =
                jwtService.generateToken(userDetails);

        UserResponse userResponse =
                toResponse(user);

        return new LoginResponse(
                token,
                userResponse
        );
    }

    private UserResponse toResponse(User user) {

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRating()
        );
    }
}