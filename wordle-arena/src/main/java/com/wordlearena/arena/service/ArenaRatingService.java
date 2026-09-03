package com.wordlearena.arena.service;

import com.wordlearena.arena.entity.ArenaMatch;
import com.wordlearena.arena.entity.ArenaMatchStatus;
import com.wordlearena.user.entity.User;
import com.wordlearena.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ArenaRatingService {

    private static final int K_FACTOR = 32;

    private final UserRepository userRepository;

    public ArenaRatingService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void updateRatings(ArenaMatch match) {

        // Cannot calculate a rating change without two players.
        if (match.getPlayer2() == null) {
            return;
        }

        // Prevent the same match from changing ratings twice.
        if (match.isRatingUpdated()) {
            return;
        }

        ArenaMatchStatus status = match.getStatus();

        // Ratings only change for completed competitive matches.
        if (status != ArenaMatchStatus.PLAYER1_WON
                && status != ArenaMatchStatus.PLAYER2_WON
                && status != ArenaMatchStatus.DRAW) {
            return;
        }

        User player1 = match.getPlayer1();
        User player2 = match.getPlayer2();

        int rating1 = player1.getRating();
        int rating2 = player2.getRating();

        double expected1 = expectedScore(rating1, rating2);
        double expected2 = expectedScore(rating2, rating1);

        double actual1;
        double actual2;

        if (status == ArenaMatchStatus.PLAYER1_WON) {

            actual1 = 1.0;
            actual2 = 0.0;

        } else if (status == ArenaMatchStatus.PLAYER2_WON) {

            actual1 = 0.0;
            actual2 = 1.0;

        } else {

            actual1 = 0.5;
            actual2 = 0.5;
        }

        int newRating1 =
                rating1 + (int) Math.round(
                        K_FACTOR * (actual1 - expected1)
                );

        int newRating2 =
                rating2 + (int) Math.round(
                        K_FACTOR * (actual2 - expected2)
                );

        player1.setRating(newRating1);
        player2.setRating(newRating2);

        userRepository.save(player1);
        userRepository.save(player2);
    }

    private double expectedScore(
            int playerRating,
            int opponentRating
    ) {
        return 1.0 / (
                1.0 +
                        Math.pow(
                                10,
                                (opponentRating - playerRating) / 400.0
                        )
        );
    }
}

