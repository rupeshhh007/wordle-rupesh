package com.wordlearena.stats.dto;

import java.util.Map;

public class StatsResponse {

    private long gamesPlayed;
    private long wins;
    private long losses;
    private double winRate;
    private int currentStreak;
    private int bestStreak;
    private Map<Integer, Long> guessDistribution;

    public StatsResponse(
            long gamesPlayed,
            long wins,
            long losses,
            double winRate,
            int currentStreak,
            int bestStreak,
            Map<Integer, Long> guessDistribution) {

        this.gamesPlayed = gamesPlayed;
        this.wins = wins;
        this.losses = losses;
        this.winRate = winRate;
        this.currentStreak = currentStreak;
        this.bestStreak = bestStreak;
        this.guessDistribution = guessDistribution;
    }

    public long getGamesPlayed() {
        return gamesPlayed;
    }

    public long getWins() {
        return wins;
    }

    public long getLosses() {
        return losses;
    }

    public double getWinRate() {
        return winRate;
    }

    public int getCurrentStreak() {
        return currentStreak;
    }

    public int getBestStreak() {
        return bestStreak;
    }

    public Map<Integer, Long> getGuessDistribution() {
        return guessDistribution;
    }
}