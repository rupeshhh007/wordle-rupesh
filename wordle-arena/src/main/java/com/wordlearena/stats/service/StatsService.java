package com.wordlearena.stats.service;

import com.wordlearena.arena.entity.ArenaMatch;
import com.wordlearena.arena.entity.ArenaMatchStatus;
import com.wordlearena.arena.repository.ArenaMatchRepository;
import com.wordlearena.game.entity.Game;
import com.wordlearena.game.entity.GameStatus;
import com.wordlearena.game.entity.GameType;
import com.wordlearena.game.repository.GameRepository;
import com.wordlearena.stats.dto.StatsResponse;
import com.wordlearena.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatsService {

    private final GameRepository gameRepository;
    private final ArenaMatchRepository arenaMatchRepository;

    public StatsService(
            GameRepository gameRepository,
            ArenaMatchRepository arenaMatchRepository) {
        this.gameRepository = gameRepository;
        this.arenaMatchRepository = arenaMatchRepository;
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

        List<ArenaMatch> completedArenaMatches =
                arenaMatchRepository.findCompletedMatchesForUser(
                        user,
                        List.of(
                                ArenaMatchStatus.PLAYER1_WON,
                                ArenaMatchStatus.PLAYER2_WON,
                                ArenaMatchStatus.DRAW
                        )
                );

        long arenaWins = 0;
        long arenaLosses = 0;
        long arenaDraws = 0;
        List<Integer> arenaWonAttempts = new ArrayList<>();

        for (ArenaMatch match : completedArenaMatches) {
            boolean isP1 = match.getPlayer1().getId().equals(user.getId());
            boolean isP2 = match.getPlayer2() != null && match.getPlayer2().getId().equals(user.getId());

            if (!isP1 && !isP2) continue;

            if (match.getStatus() == ArenaMatchStatus.PLAYER1_WON) {
                if (isP1) {
                    arenaWins++;
                    arenaWonAttempts.add(match.getPlayer1Attempts());
                } else {
                    arenaLosses++;
                }
            } else if (match.getStatus() == ArenaMatchStatus.PLAYER2_WON) {
                if (isP2) {
                    arenaWins++;
                    arenaWonAttempts.add(match.getPlayer2Attempts());
                } else {
                    arenaLosses++;
                }
            } else if (match.getStatus() == ArenaMatchStatus.DRAW) {
                arenaDraws++;
            }
        }

        long totalWins = wonGames.size() + arenaWins;
        long totalLosses = lostGames.size() + arenaLosses;
        long totalGamesPlayed = totalWins + totalLosses + arenaDraws;

        double winRate = totalGamesPlayed == 0
                ? 0.0
                : (totalWins * 100.0) / totalGamesPlayed;

        Map<Integer, Long> guessDistribution =
                buildGuessDistribution(wonGames, arenaWonAttempts);

        DailyStreakResult streak =
                calculateDailyStreaks(user);

        return new StatsResponse(
                totalGamesPlayed,
                totalWins,
                totalLosses,
                Math.round(winRate * 100.0) / 100.0,
                streak.currentStreak(),
                streak.bestStreak(),
                guessDistribution
        );
    }

    private Map<Integer, Long> buildGuessDistribution(
            List<Game> wonGames,
            List<Integer> arenaWonAttempts
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

        for (int attempts : arenaWonAttempts) {
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