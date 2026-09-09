package com.wordlearena.user.dto;

public class PublicUserProfileResponse {

    private Long id;
    private String username;
    private Integer rating;
    private int rank;

    public PublicUserProfileResponse() {
    }

    public PublicUserProfileResponse(Long id, String username, Integer rating, int rank) {
        this.id = id;
        this.username = username;
        this.rating = rating;
        this.rank = rank;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public Integer getRating() {
        return rating;
    }

    public int getRank() {
        return rank;
    }
}
