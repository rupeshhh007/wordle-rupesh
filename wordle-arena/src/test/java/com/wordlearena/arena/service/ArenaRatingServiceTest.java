package com.wordlearena.arena.service;

import com.wordlearena.arena.entity.ArenaMatch;
import com.wordlearena.arena.entity.ArenaMatchStatus;
import com.wordlearena.arena.repository.ArenaMatchRepository;
import com.wordlearena.user.entity.User;
import com.wordlearena.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ArenaRatingServiceTest {

    private UserRepository userRepository;
    private ArenaMatchRepository arenaMatchRepository;
    private ArenaRatingService ratingService;
    private final Map<Long, Long> userMatchCounts = new HashMap<>();

    @BeforeEach
    void setUp() {
        userMatchCounts.clear();

        userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    if ("save".equals(method.getName())) {
                        return args[0];
                    }
                    return null;
                }
        );

        arenaMatchRepository = (ArenaMatchRepository) Proxy.newProxyInstance(
                ArenaMatchRepository.class.getClassLoader(),
                new Class<?>[]{ArenaMatchRepository.class},
                (proxy, method, args) -> {
                    if ("countCompletedMatchesForUser".equals(method.getName())) {
                        User u = (User) args[0];
                        return userMatchCounts.getOrDefault(u.getId(), 15L);
                    }
                    return null;
                }
        );

        ratingService = new ArenaRatingService(userRepository, arenaMatchRepository);
    }

    private User createUser(Long id, String username, int rating) {
        User user = new User();
        try {
            var idField = User.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(user, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPasswordHash("hash");
        user.setRating(rating);
        return user;
    }

    @Test
    void equalRatings_establishedWinIn3Guesses_rewardsAppropriately() {
        User p1 = createUser(1L, "p1", 1000);
        User p2 = createUser(2L, "p2", 1000);
        userMatchCounts.put(1L, 15L);
        userMatchCounts.put(2L, 15L);

        ArenaMatch match = new ArenaMatch();
        match.setPlayer1(p1);
        match.setPlayer2(p2);
        match.setStatus(ArenaMatchStatus.PLAYER1_WON);
        match.setPlayer1Attempts(3);
        match.setPlayer2Attempts(4);

        ratingService.updateRatings(match);

        // P1 should gain: base ~12 (or min 12) + 2 bonus = +14
        assertTrue(p1.getRating() >= 1014, "Winner should gain at least +14 for a 3-guess solve, got: " + p1.getRating());
        // P2 had 4 attempts (close match with winner's 3), so mitigation (+3) softens loss: -12 + 3 = -9
        assertEquals(991, p2.getRating(), "Loser should have mitigated loss for close match");
    }

    @Test
    void underdogVictory_earnsSubstantialReward_andLoserCapped() {
        User underdog = createUser(1L, "underdog", 950);
        User topPlayer = createUser(2L, "topPlayer", 1250);
        userMatchCounts.put(1L, 15L);
        userMatchCounts.put(2L, 20L);

        ArenaMatch match = new ArenaMatch();
        match.setPlayer1(underdog);
        match.setPlayer2(topPlayer);
        match.setStatus(ArenaMatchStatus.PLAYER1_WON);
        match.setPlayer1Attempts(3);
        match.setPlayer2Attempts(5);

        ratingService.updateRatings(match);

        // Underdog should earn a massive reward (+21)
        assertTrue(underdog.getRating() >= 970, "Underdog should gain substantial rating (+20+) for beating high-ranked player, got: " + underdog.getRating());
        // Top player loss must be capped at -18 (instead of old -26!)
        assertEquals(1232, topPlayer.getRating(), "Top player loss should be capped at -18 max");
    }

    @Test
    void topPlayerWins_guaranteedMinimumRewardingWin_underdogLossSoftened() {
        User topPlayer = createUser(1L, "topPlayer", 1250);
        User underdog = createUser(2L, "underdog", 950);
        userMatchCounts.put(1L, 20L);
        userMatchCounts.put(2L, 15L);

        ArenaMatch match = new ArenaMatch();
        match.setPlayer1(topPlayer);
        match.setPlayer2(underdog);
        match.setStatus(ArenaMatchStatus.PLAYER1_WON);
        match.setPlayer1Attempts(4);
        match.setPlayer2Attempts(5);

        ratingService.updateRatings(match);

        // Top player gains guaranteed minimum (12) + attempt bonus (1) = +13
        assertEquals(1263, topPlayer.getRating(), "Top player should gain +13 (guaranteed minimum + attempt bonus)");
        // Underdog loss should be minimal (loss -5 with +3 close-match mitigation = -2)
        assertEquals(948, underdog.getRating(), "Underdog should barely lose points (-2) in close match against a much higher rated opponent");
    }

    @Test
    void draw_closeRatings_zeroDelta() {
        User p1 = createUser(1L, "p1", 1000);
        User p2 = createUser(2L, "p2", 1030);

        ArenaMatch match = new ArenaMatch();
        match.setPlayer1(p1);
        match.setPlayer2(p2);
        match.setStatus(ArenaMatchStatus.DRAW);
        match.setPlayer1Attempts(6);
        match.setPlayer2Attempts(6);

        ratingService.updateRatings(match);

        assertEquals(1000, p1.getRating(), "Rating should not change on close draw");
        assertEquals(1030, p2.getRating(), "Rating should not change on close draw");
    }

    @Test
    void draw_distantRatings_dampenedDelta() {
        User p1 = createUser(1L, "high", 1200);
        User p2 = createUser(2L, "low", 1000);

        ArenaMatch match = new ArenaMatch();
        match.setPlayer1(p1);
        match.setPlayer2(p2);
        match.setStatus(ArenaMatchStatus.DRAW);
        match.setPlayer1Attempts(6);
        match.setPlayer2Attempts(6);

        ratingService.updateRatings(match);

        // High rated player should lose at most -2 or -3 (old system took -8!)
        assertTrue(p1.getRating() >= 1197, "High rated player should not lose more than -3 on draw");
        assertTrue(p2.getRating() <= 1003, "Low rated player should not gain more than +3 on draw");
    }

    @Test
    void ratingFloor_preventsSub500Drop() {
        User p1 = createUser(1L, "lowPlayer", 502);
        User p2 = createUser(2L, "equalPlayer", 502);

        ArenaMatch match = new ArenaMatch();
        match.setPlayer1(p1);
        match.setPlayer2(p2);
        match.setStatus(ArenaMatchStatus.PLAYER2_WON);
        match.setPlayer1Attempts(6);
        match.setPlayer2Attempts(3);

        ratingService.updateRatings(match);

        assertEquals(500, p1.getRating(), "Rating floor should prevent rating from dropping below 500");
    }
}
