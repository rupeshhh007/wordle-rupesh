package com.wordlearena.leaderboard.dto;

public class LeaderboardEntryResponse {

    private int rank;
    private Long userId;
    private String username;
    private int rating;

    public LeaderboardEntryResponse(
            int rank,
            Long userId,
            String username,
            int rating
    ) {
        this.rank = rank;
        this.userId = userId;
        this.username = username;
        this.rating = rating;
    }

    public int getRank() {
        return rank;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public int getRating() {
        return rating;
    }
}