package com.wordlearena.arena.service;

import com.wordlearena.arena.dto.ArenaMatchDetailsResponse;
import com.wordlearena.arena.dto.ArenaMatchResponse;
import com.wordlearena.arena.entity.ArenaMatch;
import com.wordlearena.arena.entity.ArenaMatchStatus;
import com.wordlearena.arena.entity.ArenaWinner;
import com.wordlearena.arena.repository.ArenaGuessRepository;
import com.wordlearena.arena.repository.ArenaMatchRepository;
import com.wordlearena.game.entity.Word;
import com.wordlearena.game.repository.WordRepository;
import com.wordlearena.game.service.WordEvaluationService;
import com.wordlearena.user.entity.User;
import com.wordlearena.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class ArenaMatchTimeoutTest {

    private ArenaMatchRepository arenaMatchRepository;
    private ArenaGuessRepository arenaGuessRepository;
    private WordRepository wordRepository;
    private WordEvaluationService wordEvaluationService;
    private ArenaRatingService arenaRatingService;
    private UserRepository userRepository;
    private ArenaService arenaService;

    private final Map<Long, ArenaMatch> idStore = new HashMap<>();

    @BeforeEach
    void setUp() {
        idStore.clear();

        arenaMatchRepository = (ArenaMatchRepository) Proxy.newProxyInstance(
                ArenaMatchRepository.class.getClassLoader(),
                new Class<?>[]{ArenaMatchRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("save".equals(name)) {
                        ArenaMatch m = (ArenaMatch) args[0];
                        if (m.getId() == null) {
                            try {
                                Field idField = ArenaMatch.class.getDeclaredField("id");
                                idField.setAccessible(true);
                                idField.set(m, 500L + idStore.size() + 1);
                            } catch (Exception ignored) {}
                        }
                        if (m.getId() != null) {
                            idStore.put(m.getId(), m);
                        }
                        return m;
                    }
                    if ("findById".equals(name)) {
                        Long id = (Long) args[0];
                        return Optional.ofNullable(idStore.get(id));
                    }
                    if ("countCompletedMatchesForUser".equals(name)) {
                        return 10L;
                    }
                    return null;
                }
        );

        arenaGuessRepository = (ArenaGuessRepository) Proxy.newProxyInstance(
                ArenaGuessRepository.class.getClassLoader(),
                new Class<?>[]{ArenaGuessRepository.class},
                (proxy, method, args) -> {
                    if ("findByMatchAndPlayerOrderByAttemptNumberAsc".equals(method.getName())) {
                        return java.util.List.of();
                    }
                    return null;
                }
        );

        wordRepository = (WordRepository) Proxy.newProxyInstance(
                WordRepository.class.getClassLoader(),
                new Class<?>[]{WordRepository.class},
                (proxy, method, args) -> {
                    if ("existsByWordAndActiveTrue".equals(method.getName())) {
                        return true;
                    }
                    return null;
                }
        );

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

        wordEvaluationService = new WordEvaluationService();
        arenaRatingService = new ArenaRatingService(userRepository, arenaMatchRepository);
        arenaService = new ArenaService(
                arenaMatchRepository,
                arenaGuessRepository,
                wordRepository,
                wordEvaluationService,
                arenaRatingService,
                userRepository,
                null
        );
    }

    private User createUser(Long id, String username, int rating) {
        User u = new User();
        try {
            Field idF = User.class.getDeclaredField("id");
            idF.setAccessible(true);
            idF.set(u, id);
            u.setUsername(username);
            u.setRating(rating);
        } catch (Exception ignored) {}
        return u;
    }

    private Word createWord(String text) {
        Word w = new Word();
        try {
            Field wf = Word.class.getDeclaredField("word");
            wf.setAccessible(true);
            wf.set(w, text);
        } catch (Exception ignored) {}
        return w;
    }

    @Test
    void testRemainingSecondsCalculation() {
        User p1 = createUser(1L, "alice", 1200);
        User p2 = createUser(2L, "bob", 1200);
        Word word = createWord("crane");

        ArenaMatch match = new ArenaMatch();
        match.setPlayer1(p1);
        match.setPlayer2(p2);
        match.setWord(word);
        match.setStatus(ArenaMatchStatus.IN_PROGRESS);
        match.setCreatedAt(LocalDateTime.now().minusSeconds(30));
        match.setStartedAt(LocalDateTime.now().minusSeconds(30));

        int remaining = arenaService.calculateRemainingSeconds(match);
        assertTrue(remaining >= 148 && remaining <= 150, "Remaining seconds should be around 150");
        assertFalse(arenaService.isMatchTimedOut(match));
    }

    @Test
    void testIsMatchTimedOutTrueAfter180Seconds() {
        User p1 = createUser(1L, "alice", 1200);
        User p2 = createUser(2L, "bob", 1200);
        Word word = createWord("crane");

        ArenaMatch match = new ArenaMatch();
        match.setPlayer1(p1);
        match.setPlayer2(p2);
        match.setWord(word);
        match.setStatus(ArenaMatchStatus.IN_PROGRESS);
        match.setCreatedAt(LocalDateTime.now().minusSeconds(200));
        match.setStartedAt(LocalDateTime.now().minusSeconds(200));

        assertTrue(arenaService.isMatchTimedOut(match));
        assertEquals(0, arenaService.calculateRemainingSeconds(match));
    }

    @Test
    void testSubmitGuessFailsWhenTimedOutAndMarksDraw() {
        User p1 = createUser(1L, "alice", 1200);
        User p2 = createUser(2L, "bob", 1200);
        Word word = createWord("crane");

        ArenaMatch match = new ArenaMatch();
        match.setPlayer1(p1);
        match.setPlayer2(p2);
        match.setWord(word);
        match.setStatus(ArenaMatchStatus.IN_PROGRESS);
        match.setCreatedAt(LocalDateTime.now().minusSeconds(190));
        match.setStartedAt(LocalDateTime.now().minusSeconds(190));
        arenaMatchRepository.save(match);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                arenaService.submitGuess(match.getId(), "slate", p1)
        );

        assertTrue(ex.getMessage().contains("time limit expired"));
        assertEquals(ArenaMatchStatus.DRAW, match.getStatus());
        assertEquals(ArenaWinner.DRAW, match.getWinner());
        assertNotNull(match.getCompletedAt());
        assertTrue(match.isRatingUpdated());
    }

    @Test
    void testTimeoutMatchEndpointTransitionsToDraw() {
        User p1 = createUser(1L, "alice", 1200);
        User p2 = createUser(2L, "bob", 1200);
        Word word = createWord("crane");

        ArenaMatch match = new ArenaMatch();
        match.setPlayer1(p1);
        match.setPlayer2(p2);
        match.setWord(word);
        match.setStatus(ArenaMatchStatus.IN_PROGRESS);
        match.setCreatedAt(LocalDateTime.now().minusSeconds(181));
        match.setStartedAt(LocalDateTime.now().minusSeconds(181));
        arenaMatchRepository.save(match);

        ArenaMatchResponse response = arenaService.timeoutMatch(match.getId(), p1);

        assertEquals(ArenaMatchStatus.DRAW, response.getStatus());
        assertEquals(ArenaWinner.DRAW, response.getWinner());
        assertEquals("crane", response.getWord());
        assertEquals(180, response.getTimeLimitSeconds());
        assertEquals(0, response.getRemainingSeconds());
    }

    @Test
    void testGetMatchAutoExpiresTimedOutMatch() {
        User p1 = createUser(1L, "alice", 1200);
        User p2 = createUser(2L, "bob", 1200);
        Word word = createWord("crane");

        ArenaMatch match = new ArenaMatch();
        match.setPlayer1(p1);
        match.setPlayer2(p2);
        match.setWord(word);
        match.setStatus(ArenaMatchStatus.IN_PROGRESS);
        match.setCreatedAt(LocalDateTime.now().minusSeconds(185));
        match.setStartedAt(LocalDateTime.now().minusSeconds(185));
        arenaMatchRepository.save(match);

        ArenaMatchResponse response = arenaService.getMatch(match.getId(), p1);
        assertEquals(ArenaMatchStatus.DRAW, response.getStatus());
        assertEquals(ArenaWinner.DRAW, response.getWinner());
        assertEquals("crane", response.getWord());

        ArenaMatchDetailsResponse details = arenaService.getMatchDetails(match.getId(), p1);
        assertEquals(ArenaMatchStatus.DRAW, details.getStatus());
        assertEquals(ArenaWinner.DRAW, details.getWinner());
        assertEquals("crane", details.getWord());
    }
}
