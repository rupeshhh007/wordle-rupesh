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
                .orElseGet(() -> createDailyGame(user, today));
    }

    private Game createDailyGame(
            User user,
            LocalDate date) {

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
         * The same date always produces the same index.
         */
        int index = Math.floorMod(
                date.toEpochDay(),
                answerPool.size()
        );

        Word dailyWord = answerPool.get(index);

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