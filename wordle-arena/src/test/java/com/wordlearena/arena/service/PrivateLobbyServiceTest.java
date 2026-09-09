package com.wordlearena.arena.service;

import com.wordlearena.arena.dto.ArenaMatchResponse;
import com.wordlearena.arena.entity.ArenaMatch;
import com.wordlearena.arena.entity.ArenaMatchStatus;
import com.wordlearena.arena.repository.ArenaGuessRepository;
import com.wordlearena.arena.repository.ArenaMatchRepository;
import com.wordlearena.game.entity.Word;
import com.wordlearena.game.repository.WordRepository;
import com.wordlearena.game.service.WordEvaluationService;
import com.wordlearena.user.entity.User;
import com.wordlearena.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class PrivateLobbyServiceTest {

    private ArenaMatchRepository arenaMatchRepository;
    private ArenaGuessRepository arenaGuessRepository;
    private WordRepository wordRepository;
    private WordEvaluationService wordEvaluationService;
    private ArenaRatingService arenaRatingService;
    private ArenaService arenaService;

    private final Map<String, ArenaMatch> matchStore = new HashMap<>();
    private final Map<Long, ArenaMatch> idStore = new HashMap<>();

    @BeforeEach
    void setUp() {
        matchStore.clear();
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
                                var idField = ArenaMatch.class.getDeclaredField("id");
                                idField.setAccessible(true);
                                idField.set(m, 100L + idStore.size() + 1);
                            } catch (Exception ignored) {}
                        }
                        if (m.getId() != null) {
                            idStore.put(m.getId(), m);
                        }
                        if (m.getInviteCode() != null) {
                            matchStore.put(m.getInviteCode(), m);
                        }
                        return m;
                    }
                    if ("findById".equals(name)) {
                        Long id = (Long) args[0];
                        return Optional.ofNullable(idStore.get(id));
                    }
                    if ("findByInviteCode".equals(name)) {
                        String code = (String) args[0];
                        return Optional.ofNullable(matchStore.get(code));
                    }
                    if ("existsByInviteCode".equals(name)) {
                        String code = (String) args[0];
                        return matchStore.containsKey(code);
                    }
                    if ("cancelWaitingPrivateMatchesForUser".equals(name)) {
                        return 0;
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
                (proxy, method, args) -> null
        );

        wordRepository = (WordRepository) Proxy.newProxyInstance(
                WordRepository.class.getClassLoader(),
                new Class<?>[]{WordRepository.class},
                (proxy, method, args) -> {
                    if ("findRandomAnswerEligibleWord".equals(method.getName())) {
                        Word w = new Word();
                        try {
                            var wField = Word.class.getDeclaredField("word");
                            wField.setAccessible(true);
                            wField.set(w, "crane");
                        } catch (Exception ignored) {}
                        return Optional.of(w);
                    }
                    return null;
                }
        );

        wordEvaluationService = new WordEvaluationService();

        UserRepository userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    if ("save".equals(method.getName())) {
                        return args[0];
                    }
                    return null;
                }
        );

        arenaRatingService = new ArenaRatingService(userRepository, arenaMatchRepository);

        arenaService = new ArenaService(
                arenaMatchRepository,
                arenaGuessRepository,
                wordRepository,
                wordEvaluationService,
                arenaRatingService
        );
    }

    private User createUser(Long id, String username) {
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
        user.setRating(1000);
        return user;
    }

    @Test
    void createPrivateMatch_generatesValidPrivateRoom() {
        User host = createUser(1L, "hostUser");

        ArenaMatchResponse response = arenaService.createPrivateMatch(host);

        assertNotNull(response);
        assertTrue(response.isPrivate(), "Match must be marked private");
        assertNotNull(response.getInviteCode(), "Invite code must be generated");
        assertEquals(6, response.getInviteCode().length(), "Invite code must be exactly 6 characters");
        assertEquals(ArenaMatchStatus.WAITING, response.getStatus(), "Initial status must be WAITING");
        assertEquals("hostUser", response.getPlayer1());
        assertNull(response.getPlayer2());
    }

    @Test
    void joinPrivateMatch_successfulJoin_transitionsToInProgress() {
        User host = createUser(1L, "hostUser");
        User friend = createUser(2L, "friendUser");

        ArenaMatchResponse created = arenaService.createPrivateMatch(host);
        String code = created.getInviteCode();

        ArenaMatchResponse joined = arenaService.joinPrivateMatch(code.toLowerCase(), friend);

        assertNotNull(joined);
        assertEquals(ArenaMatchStatus.IN_PROGRESS, joined.getStatus(), "Status should transition to IN_PROGRESS");
        assertEquals("hostUser", joined.getPlayer1());
        assertEquals("friendUser", joined.getPlayer2());
        assertNotNull(joined.getStartedAt());
    }

    @Test
    void joinPrivateMatch_hostReentry_returnsMatchCleanly() {
        User host = createUser(1L, "hostUser");

        ArenaMatchResponse created = arenaService.createPrivateMatch(host);
        String code = created.getInviteCode();

        ArenaMatchResponse reentered = arenaService.joinPrivateMatch(code, host);

        assertNotNull(reentered);
        assertEquals(ArenaMatchStatus.WAITING, reentered.getStatus(), "Host re-entry keeps WAITING status");
        assertEquals("hostUser", reentered.getPlayer1());
    }

    @Test
    void joinPrivateMatch_invalidCode_throwsException() {
        User friend = createUser(2L, "friendUser");

        assertThrows(IllegalArgumentException.class, () ->
                arenaService.joinPrivateMatch("BADCOD", friend)
        );
    }

    @Test
    void joinPrivateMatch_alreadyFull_throwsException() {
        User host = createUser(1L, "hostUser");
        User friend1 = createUser(2L, "friend1");
        User friend2 = createUser(3L, "friend2");

        ArenaMatchResponse created = arenaService.createPrivateMatch(host);
        arenaService.joinPrivateMatch(created.getInviteCode(), friend1);

        // Third player trying to join the duel
        assertThrows(IllegalStateException.class, () ->
                arenaService.joinPrivateMatch(created.getInviteCode(), friend2)
        );
    }

    @Test
    void joinPrivateMatch_cancelledLobby_throwsException() {
        User host = createUser(1L, "hostUser");
        User friend = createUser(2L, "friendUser");

        ArenaMatchResponse created = arenaService.createPrivateMatch(host);
        ArenaMatch match = matchStore.get(created.getInviteCode());
        match.setStatus(ArenaMatchStatus.CANCELLED);

        assertThrows(IllegalStateException.class, () ->
                arenaService.joinPrivateMatch(created.getInviteCode(), friend)
        );
    }

    @Test
    void joinPrivateMatch_expiredLobby_throwsException() {
        User host = createUser(1L, "hostUser");
        User friend = createUser(2L, "friendUser");

        ArenaMatchResponse created = arenaService.createPrivateMatch(host);
        ArenaMatch match = matchStore.get(created.getInviteCode());
        match.setCreatedAt(LocalDateTime.now().minusMinutes(20)); // Expired > 15 mins

        assertThrows(IllegalStateException.class, () ->
                arenaService.joinPrivateMatch(created.getInviteCode(), friend)
        );
    }

    @Test
    void requestRematch_firstPlayer_updatesStatusWaitingForOpponent() {
        User host = createUser(1L, "hostUser");
        User friend = createUser(2L, "friendUser");

        ArenaMatchResponse created = arenaService.createPrivateMatch(host);
        arenaService.joinPrivateMatch(created.getInviteCode(), friend);

        ArenaMatch match = matchStore.get(created.getInviteCode());
        match.setStatus(ArenaMatchStatus.PLAYER1_WON);

        ArenaMatchResponse rematchRes = arenaService.requestRematch(match.getId(), host);

        assertTrue(rematchRes.isRematchRequestedByPlayer1(), "Player 1 has requested rematch");
        assertFalse(rematchRes.isRematchRequestedByPlayer2(), "Player 2 has not yet requested rematch");
        assertNull(rematchRes.getNextMatchId(), "No new match created yet");
    }

    @Test
    void requestRematch_bothPlayers_createsNewInProgressMatch() {
        User host = createUser(1L, "hostUser");
        User friend = createUser(2L, "friendUser");

        ArenaMatchResponse created = arenaService.createPrivateMatch(host);
        arenaService.joinPrivateMatch(created.getInviteCode(), friend);

        ArenaMatch match = matchStore.get(created.getInviteCode());
        match.setStatus(ArenaMatchStatus.PLAYER2_WON);

        arenaService.requestRematch(match.getId(), host);
        ArenaMatchResponse secondRes = arenaService.requestRematch(match.getId(), friend);

        assertTrue(secondRes.isRematchRequestedByPlayer1());
        assertTrue(secondRes.isRematchRequestedByPlayer2());
        assertNotNull(secondRes.getNextMatchId(), "New match created!");

        ArenaMatch newMatch = idStore.get(secondRes.getNextMatchId());

        assertNotNull(newMatch);
        assertEquals(ArenaMatchStatus.IN_PROGRESS, newMatch.getStatus());
        assertEquals("hostUser", newMatch.getPlayer1().getUsername());
        assertEquals("friendUser", newMatch.getPlayer2().getUsername());
        assertEquals(created.getInviteCode(), newMatch.getInviteCode(), "Preserves private lobby invite code");
    }

    @Test
    void cancelRematch_resetsFlag() {
        User host = createUser(1L, "hostUser");
        User friend = createUser(2L, "friendUser");

        ArenaMatchResponse created = arenaService.createPrivateMatch(host);
        arenaService.joinPrivateMatch(created.getInviteCode(), friend);

        ArenaMatch match = matchStore.get(created.getInviteCode());
        match.setStatus(ArenaMatchStatus.DRAW);

        arenaService.requestRematch(match.getId(), host);
        ArenaMatchResponse cancelled = arenaService.cancelRematch(match.getId(), host);

        assertFalse(cancelled.isRematchRequestedByPlayer1());
        assertNull(cancelled.getNextMatchId());
    }

    @Test
    void requestRematch_notCompleted_throwsException() {
        User host = createUser(1L, "hostUser");
        User friend = createUser(2L, "friendUser");

        ArenaMatchResponse created = arenaService.createPrivateMatch(host);
        arenaService.joinPrivateMatch(created.getInviteCode(), friend);

        ArenaMatch match = matchStore.get(created.getInviteCode());
        // Status is still IN_PROGRESS

        assertThrows(IllegalStateException.class, () ->
                arenaService.requestRematch(match.getId(), host)
        );
    }

    @Test
    void leaveLobby_resetsPlayerRematchFlagCleanly() {
        User host = createUser(1L, "hostUser");
        User friend = createUser(2L, "friendUser");

        ArenaMatchResponse created = arenaService.createPrivateMatch(host);
        arenaService.joinPrivateMatch(created.getInviteCode(), friend);

        ArenaMatch match = matchStore.get(created.getInviteCode());
        match.setStatus(ArenaMatchStatus.PLAYER1_WON);

        // Host requested rematch
        arenaService.requestRematch(match.getId(), host);
        assertTrue(match.isRematchRequestedByPlayer1());

        // Host then leaves lobby
        ArenaMatchResponse left = arenaService.leaveLobby(match.getId(), host);
        assertFalse(left.isRematchRequestedByPlayer1(), "Rematch flag should be reset when player leaves lobby");
        assertTrue(left.isLobbyClosed(), "Lobby should be marked as closed");
        assertEquals("hostUser", left.getPlayerLeft(), "Player who left should be recorded");
    }

    @Test
    void leaveLobby_whenWaiting_cancelsMatch() {
        User host = createUser(1L, "hostUser");
        ArenaMatchResponse created = arenaService.createPrivateMatch(host);

        ArenaMatchResponse left = arenaService.leaveLobby(created.getId(), host);
        assertEquals(ArenaMatchStatus.CANCELLED, left.getStatus(), "WAITING match should be CANCELLED on leave");
        assertTrue(left.isLobbyClosed());
    }
}
