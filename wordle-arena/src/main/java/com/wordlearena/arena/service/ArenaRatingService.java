package com.wordlearena.arena.service;

import com.wordlearena.arena.entity.ArenaMatch;
import com.wordlearena.arena.entity.ArenaMatchStatus;
import com.wordlearena.arena.repository.ArenaMatchRepository;
import com.wordlearena.user.entity.User;
import com.wordlearena.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ArenaRatingService {

    public static final int RATING_FLOOR = 500;
    public static final int MIN_WIN_GAIN = 12;
    public static final int MIN_WIN_GAIN_HIGH_TIER = 10;
    public static final int MAX_LOSS_ESTABLISHED = 18;
    public static final int MAX_LOSS_PROVISIONAL = 20;
    public static final int MAX_WIN_GAIN = 28;
    public static final double SCALE_FACTOR = 500.0;
    public static final int PROVISIONAL_THRESHOLD = 10;

    private static final List<ArenaMatchStatus> COMPLETED_STATUSES = List.of(
            ArenaMatchStatus.PLAYER1_WON,
            ArenaMatchStatus.PLAYER2_WON,
            ArenaMatchStatus.DRAW
    );

    private final UserRepository userRepository;
    private final ArenaMatchRepository arenaMatchRepository;

    public ArenaRatingService(
            UserRepository userRepository,
            ArenaMatchRepository arenaMatchRepository
    ) {
        this.userRepository = userRepository;
        this.arenaMatchRepository = arenaMatchRepository;
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

        int p1Matches = (int) arenaMatchRepository.countCompletedMatchesForUser(player1, COMPLETED_STATUSES);
        int p2Matches = (int) arenaMatchRepository.countCompletedMatchesForUser(player2, COMPLETED_STATUSES);

        int rating1 = player1.getRating();
        int rating2 = player2.getRating();

        double expected1 = expectedScore(rating1, rating2);
        double expected2 = expectedScore(rating2, rating1);

        int k1 = determineKFactor(player1, p1Matches);
        int k2 = determineKFactor(player2, p2Matches);

        boolean p1Provisional = p1Matches < PROVISIONAL_THRESHOLD;
        boolean p2Provisional = p2Matches < PROVISIONAL_THRESHOLD;

        int p1Attempts = match.getPlayer1Attempts() != null ? match.getPlayer1Attempts() : 0;
        int p2Attempts = match.getPlayer2Attempts() != null ? match.getPlayer2Attempts() : 0;

        int delta1;
        int delta2;

        if (status == ArenaMatchStatus.PLAYER1_WON) {
            delta1 = calculateWinDelta(rating1, expected1, k1, p1Attempts);
            delta2 = calculateLossDelta(rating2, expected2, k2, p1Attempts, p2Attempts, p2Provisional);
        } else if (status == ArenaMatchStatus.PLAYER2_WON) {
            delta1 = calculateLossDelta(rating1, expected1, k1, p2Attempts, p1Attempts, p1Provisional);
            delta2 = calculateWinDelta(rating2, expected2, k2, p2Attempts);
        } else {
            delta1 = calculateDrawDelta(rating1, rating2, expected1);
            delta2 = calculateDrawDelta(rating2, rating1, expected2);
        }

        int newRating1 = Math.max(RATING_FLOOR, rating1 + delta1);
        int newRating2 = Math.max(RATING_FLOOR, rating2 + delta2);

        player1.setRating(newRating1);
        player2.setRating(newRating2);

        userRepository.save(player1);
        userRepository.save(player2);
    }

    int determineKFactor(User user, int matchCount) {
        if (matchCount < PROVISIONAL_THRESHOLD) {
            return 32; // More responsive for new accounts
        }
        if (user.getRating() >= 1300) {
            return 20; // Stable ceiling for high-tier players
        }
        return 24; // Balanced standard for established players
    }

    double expectedScore(int playerRating, int opponentRating) {
        int diff = Math.max(-400, Math.min(400, opponentRating - playerRating));
        return 1.0 / (1.0 + Math.pow(10.0, diff / SCALE_FACTOR));
    }

    int calculateAttemptBonus(int winnerAttempts) {
        if (winnerAttempts <= 2 && winnerAttempts >= 1) {
            return 4; // Masterclass solve (1-2 guesses)
        } else if (winnerAttempts == 3) {
            return 2; // Great solve (3 guesses)
        } else if (winnerAttempts == 4) {
            return 1; // Solid solve (4 guesses)
        }
        return 0; // Standard solve (5-6 guesses)
    }

    int calculateLoserMitigation(int winnerAttempts, int loserAttempts) {
        if (loserAttempts >= 3 && Math.abs(loserAttempts - winnerAttempts) <= 1) {
            return 3; // Tight, neck-and-neck match mitigation
        }
        return 0;
    }

    int calculateWinDelta(int playerRating, double expected, int kFactor, int winnerAttempts) {
        double raw = kFactor * (1.0 - expected);
        int baseGain = (int) Math.round(raw);

        int minWin = (playerRating >= 1400) ? MIN_WIN_GAIN_HIGH_TIER : MIN_WIN_GAIN;
        int gain = Math.max(minWin, baseGain);

        gain += calculateAttemptBonus(winnerAttempts);
        return Math.min(MAX_WIN_GAIN, gain);
    }

    int calculateLossDelta(int playerRating, double expected, int kFactor, int winnerAttempts, int loserAttempts, boolean isProvisional) {
        double raw = kFactor * (0.0 - expected);
        int baseLoss = (int) Math.round(raw);

        int maxLoss = isProvisional ? MAX_LOSS_PROVISIONAL : MAX_LOSS_ESTABLISHED;
        int cappedLoss = Math.max(-maxLoss, baseLoss);

        int mitigation = calculateLoserMitigation(winnerAttempts, loserAttempts);
        int finalLoss = cappedLoss + mitigation;

        return Math.min(-2, finalLoss);
    }

    int calculateDrawDelta(int playerRating, int opponentRating, double expected) {
        int diff = Math.abs(playerRating - opponentRating);
        if (diff < 100) {
            return 0;
        }
        double raw = 8.0 * (0.5 - expected);
        int delta = (int) Math.round(raw);
        return Math.max(-3, Math.min(3, delta));
    }
}

