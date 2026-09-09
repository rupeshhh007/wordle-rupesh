package com.wordlearena.daily.service;

import com.wordlearena.game.entity.Game;
import com.wordlearena.game.entity.GameStatus;
import com.wordlearena.game.entity.GameType;
import com.wordlearena.game.entity.Word;
import com.wordlearena.game.repository.GameRepository;
import com.wordlearena.game.repository.WordRepository;
import com.wordlearena.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class DailyService {

    private final GameRepository gameRepository;
    private final WordRepository wordRepository;

    public DailyService(
            GameRepository gameRepository,
            WordRepository wordRepository) {

        this.gameRepository = gameRepository;
        this.wordRepository = wordRepository;
    }

    @Transactional
    public Game getOrCreateDailyGame(User user) {

        LocalDate today = LocalDate.now();
        Word dailyWord = getDailyWord(today);

        /*
         * If the user already has a Daily game today,
         * return it instead of creating another one.
         */
        return gameRepository
                .findByUserAndGameTypeAndGameDate(
                        user,
                        GameType.DAILY,
                        today
                )
                .map(existingGame -> {
                    /*
                     * If the game has not been played yet (0 attempts) and is in progress,
                     * ensure it points to the canonical daily word for today (in case of answer pool updates).
                     */
                    if (existingGame.getStatus() == GameStatus.IN_PROGRESS
                            && existingGame.getAttemptCount() == 0
                            && existingGame.getWord() != null
                            && !existingGame.getWord().getId().equals(dailyWord.getId())) {
                        existingGame.setWord(dailyWord);
                        return gameRepository.save(existingGame);
                    }
                    return existingGame;
                })
                .orElseGet(() -> createDailyGame(user, today, dailyWord));
    }

    public Word getDailyWord(LocalDate date) {

        List<Word> answerPool =
                wordRepository.findAllAnswerEligibleWords();

        if (answerPool.isEmpty()) {
            throw new IllegalStateException(
                    "No answer-eligible words available"
            );
        }

        /*
         * Deterministic word selection.
         *
         * The same date always produces the exact same index.
         */
        int index = Math.floorMod(
                date.toEpochDay(),
                answerPool.size()
        );

        return answerPool.get(index);
    }

    private Game createDailyGame(
            User user,
            LocalDate date,
            Word dailyWord) {

        Game game = new Game();

        game.setUser(user);
        game.setWord(dailyWord);
        game.setGameType(GameType.DAILY);
        game.setGameDate(date);
        game.setStatus(GameStatus.IN_PROGRESS);
        game.setAttemptCount(0);
        game.setStartedAt(
                java.time.LocalDateTime.now()
        );

        return gameRepository.save(game);
    }
}