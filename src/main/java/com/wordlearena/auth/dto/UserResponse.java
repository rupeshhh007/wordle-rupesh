package com.wordlearena.auth.dto;

public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private Integer rating;

    public UserResponse(
            Long id,
            String username,
            String email,
            Integer rating) {

        this.id = id;
        this.username = username;
        this.email = email;
        this.rating = rating;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public Integer getRating() {
        return rating;
    }
}