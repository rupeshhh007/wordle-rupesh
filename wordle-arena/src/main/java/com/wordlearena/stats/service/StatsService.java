package com.wordlearena.stats.service;

import com.wordlearena.game.entity.Game;
import com.wordlearena.game.entity.GameStatus;
import com.wordlearena.game.entity.GameType;
import com.wordlearena.game.repository.GameRepository;
import com.wordlearena.stats.dto.StatsResponse;
import com.wordlearena.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatsService {

    private final GameRepository gameRepository;

    public StatsService(GameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    @Transactional(readOnly = true)
    public StatsResponse getStats(User user) {

        List<Game> wonGames =
                gameRepository.findByUserAndStatusOrderByStartedAtAsc(
                        user,
                        GameStatus.WON
                );

        List<Game> lostGames =
                gameRepository.findByUserAndStatusOrderByStartedAtAsc(
                        user,
                        GameStatus.LOST
                );

        long wins = wonGames.size();
        long losses = lostGames.size();
        long gamesPlayed = wins + losses;

        double winRate = gamesPlayed == 0
                ? 0.0
                : (wins * 100.0) / gamesPlayed;

        Map<Integer, Long> guessDistribution =
                buildGuessDistribution(wonGames);

        DailyStreakResult streak =
                calculateDailyStreaks(user);

        return new StatsResponse(
                gamesPlayed,
                wins,
                losses,
                Math.round(winRate * 100.0) / 100.0,
                streak.currentStreak(),
                streak.bestStreak(),
                guessDistribution
        );
    }

    private Map<Integer, Long> buildGuessDistribution(
            List<Game> wonGames
    ) {
        Map<Integer, Long> distribution =
                new LinkedHashMap<>();

        for (int attempts = 1; attempts <= 6; attempts++) {
            distribution.put(attempts, 0L);
        }

        for (Game game : wonGames) {

            int attempts = game.getAttemptCount();

            if (attempts >= 1 && attempts <= 6) {
                distribution.put(
                        attempts,
                        distribution.get(attempts) + 1
                );
            }
        }

        return distribution;
    }

    private DailyStreakResult calculateDailyStreaks(User user) {

        List<Game> dailyGames =
                gameRepository.findByUserAndGameTypeOrderByGameDateAsc(
                        user,
                        GameType.DAILY
                );

        List<Game> completedDailyGames =
                dailyGames.stream()
                        .filter(game ->
                                game.getStatus() == GameStatus.WON
                                        || game.getStatus() == GameStatus.LOST
                        )
                        .filter(game -> game.getGameDate() != null)
                        .sorted(
                                Comparator.comparing(Game::getGameDate)
                        )
                        .toList();

        if (completedDailyGames.isEmpty()) {
            return new DailyStreakResult(0, 0);
        }

        int currentStreak = 0;
        int bestStreak = 0;

        LocalDate previousDate = null;

        for (Game game : completedDailyGames) {

            LocalDate currentDate = game.getGameDate();

            boolean consecutive =
                    previousDate != null
                            && currentDate.equals(
                            previousDate.plusDays(1)
                    );

            if (game.getStatus() == GameStatus.WON) {

                if (consecutive) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }

                bestStreak =
                        Math.max(bestStreak, currentStreak);

            } else {
                currentStreak = 0;
            }

            previousDate = currentDate;
        }

        Game latestGame =
                completedDailyGames.get(
                        completedDailyGames.size() - 1
                );

        LocalDate today = LocalDate.now();

        /*
         * If the last completed Daily game was more than
         * one day ago, the current streak is broken.
         */
        if (latestGame.getGameDate()
                .isBefore(today.minusDays(1))) {

            currentStreak = 0;
        }

        return new DailyStreakResult(
                currentStreak,
                bestStreak
        );
    }

    private record DailyStreakResult(
            int currentStreak,
            int bestStreak
    ) {}
}