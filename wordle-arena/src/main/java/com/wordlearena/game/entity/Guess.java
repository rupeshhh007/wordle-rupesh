package com.wordlearena.game.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "guesses",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_game_attempt",
                        columnNames = {"game_id", "attempt_number"}
                )
        }
)
public class Guess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Column(nullable = false, length = 5)
    private String guess;

    @Column(nullable = false)
    private Integer attemptNumber;

    @Column(nullable = false)
    private String result;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Guess() {
    }

    public Long getId() {
        return id;
    }

    public Game getGame() {
        return game;
    }

    public String getGuess() {
        return guess;
    }

    public Integer getAttemptNumber() {
        return attemptNumber;
    }

    public String getResult() {
        return result;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setGame(Game game) {
        this.game = game;
    }

    public void setGuess(String guess) {
        this.guess = guess;
    }

    public void setAttemptNumber(Integer attemptNumber) {
        this.attemptNumber = attemptNumber;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}