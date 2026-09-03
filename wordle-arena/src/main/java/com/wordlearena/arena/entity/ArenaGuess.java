package com.wordlearena.arena.entity;

import com.wordlearena.user.entity.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "arena_guesses",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_arena_player_attempt",
                        columnNames = {
                                "match_id",
                                "player_id",
                                "attempt_number"
                        }
                )
        }
)
public class ArenaGuess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "match_id", nullable = false)
    private ArenaMatch match;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player_id", nullable = false)
    private User player;

    @Column(nullable = false, length = 5)
    private String guess;

    @Column(nullable = false)
    private Integer attemptNumber;

    @Column(nullable = false, length = 100)
    private String result;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public ArenaGuess() {
    }

    public Long getId() {
        return id;
    }

    public ArenaMatch getMatch() {
        return match;
    }

    public void setMatch(ArenaMatch match) {
        this.match = match;
    }

    public User getPlayer() {
        return player;
    }

    public void setPlayer(User player) {
        this.player = player;
    }

    public String getGuess() {
        return guess;
    }

    public void setGuess(String guess) {
        this.guess = guess;
    }

    public Integer getAttemptNumber() {
        return attemptNumber;
    }

    public void setAttemptNumber(Integer attemptNumber) {
        this.attemptNumber = attemptNumber;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}