package com.wordlearena.game.entity;

import jakarta.persistence.*;
import lombok.Setter;

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

    @Setter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Setter
    @Column(nullable = false, length = 5)
    private String guess;

    @Setter
    @Column(nullable = false)
    private Integer attemptNumber;

    @Setter
    @Column(nullable = false)
    private String result;

    @Setter
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
}