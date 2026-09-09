package com.wordlearena.daily.service;

import com.wordlearena.game.entity.Game;
import com.wordlearena.game.entity.GameStatus;
import com.wordlearena.game.entity.GameType;
import com.wordlearena.game.entity.Word;
import com.wordlearena.game.repository.GameRepository;
import com.wordlearena.game.repository.WordRepository;
import com.wordlearena.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class DailyServiceTest {

    private GameRepository gameRepository;
    private WordRepository wordRepository;
    private DailyService dailyService;

    private final Map<String, Game> gameStore = new HashMap<>();
    private final List<Word> answerPool = new ArrayList<>();

    @BeforeEach
    void setUp() {
        gameStore.clear();
        answerPool.clear();

        for (int i = 0; i < 5; i++) {
            Word w = new Word();
            try {
                var idField = Word.class.getDeclaredField("id");
                idField.setAccessible(true);
                idField.set(w, (long) (i + 1));
                var wordField = Word.class.getDeclaredField("word");
                wordField.setAccessible(true);
                wordField.set(w, "word" + i);
            } catch (Exception ignored) {}
            w.setActive(true);
            w.setAnswerEligible(true);
            answerPool.add(w);
        }

        wordRepository = (WordRepository) Proxy.newProxyInstance(
                WordRepository.class.getClassLoader(),
                new Class<?>[]{WordRepository.class},
                (proxy, method, args) -> {
                    if ("findAllAnswerEligibleWords".equals(method.getName())) {
                        return new ArrayList<>(answerPool);
                    }
                    return null;
                }
        );

        gameRepository = (GameRepository) Proxy.newProxyInstance(
                GameRepository.class.getClassLoader(),
                new Class<?>[]{GameRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("findByUserAndGameTypeAndGameDate".equals(name)) {
                        User u = (User) args[0];
                        LocalDate d = (LocalDate) args[2];
                        String key = u.getId() + "_" + d.toString();
                        return Optional.ofNullable(gameStore.get(key));
                    }
                    if ("save".equals(name)) {
                        Game g = (Game) args[0];
                        if (g.getId() == null) {
                            try {
                                var idField = Game.class.getDeclaredField("id");
                                idField.setAccessible(true);
                                idField.set(g, (long) (gameStore.size() + 1));
                            } catch (Exception ignored) {}
                        }
                        String key = g.getUser().getId() + "_" + g.getGameDate().toString();
                        gameStore.put(key, g);
                        return g;
                    }
                    return null;
                }
        );

        dailyService = new DailyService(gameRepository, wordRepository);
    }

    private User createUser(Long id, String username) {
        User user = new User();
        try {
            var idField = User.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(user, id);
        } catch (Exception ignored) {}
        user.setUsername(username);
        return user;
    }

    @Test
    void getOrCreateDailyGame_multipleUsersGetSameWordOnSameDate() {
        User user1 = createUser(1L, "player1");
        User user2 = createUser(2L, "player2");

        Game game1 = dailyService.getOrCreateDailyGame(user1);
        Game game2 = dailyService.getOrCreateDailyGame(user2);

        assertNotNull(game1);
        assertNotNull(game2);
        assertEquals(game1.getWord().getId(), game2.getWord().getId(), "Both users must have the exact same word");
        assertEquals(game1.getWord().getWord(), game2.getWord().getWord());
    }

    @Test
    void getOrCreateDailyGame_updatesStaleWordWhenUnplayed() {
        User user1 = createUser(1L, "player1");

        Word staleWord = new Word();
        try {
            var idField = Word.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(staleWord, 999L);
            var wordField = Word.class.getDeclaredField("word");
            wordField.setAccessible(true);
            wordField.set(staleWord, "stale");
        } catch (Exception ignored) {}

        Game existingGame = new Game();
        existingGame.setUser(user1);
        existingGame.setWord(staleWord);
        existingGame.setGameType(GameType.DAILY);
        existingGame.setGameDate(LocalDate.now());
        existingGame.setStatus(GameStatus.IN_PROGRESS);
        existingGame.setAttemptCount(0);

        gameRepository.save(existingGame);

        Game game = dailyService.getOrCreateDailyGame(user1);

        assertNotNull(game);
        assertNotEquals(999L, game.getWord().getId(), "Stale word should be updated to canonical daily word");
        assertEquals(dailyService.getDailyWord(LocalDate.now()).getId(), game.getWord().getId());
    }

    @Test
    void getOrCreateDailyGame_preservesWordIfGuessesAlreadyMade() {
        User user1 = createUser(1L, "player1");

        Word customWord = new Word();
        try {
            var idField = Word.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(customWord, 888L);
            var wordField = Word.class.getDeclaredField("word");
            wordField.setAccessible(true);
            wordField.set(customWord, "first");
        } catch (Exception ignored) {}

        Game existingGame = new Game();
        existingGame.setUser(user1);
        existingGame.setWord(customWord);
        existingGame.setGameType(GameType.DAILY);
        existingGame.setGameDate(LocalDate.now());
        existingGame.setStatus(GameStatus.IN_PROGRESS);
        existingGame.setAttemptCount(2);

        gameRepository.save(existingGame);

        Game game = dailyService.getOrCreateDailyGame(user1);

        assertEquals(888L, game.getWord().getId(), "Game in progress with attempts must not change word");
    }
}
