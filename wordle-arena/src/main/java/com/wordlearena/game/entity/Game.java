package com.wordlearena.game.entity;

import com.wordlearena.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "games")
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @Getter
    @Setter
    @Column
    private LocalDate gameDate;

    @Setter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Setter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "word_id", nullable = false)
    private Word word;

    @Setter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GameType gameType;

    @Setter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GameStatus status;

    @Setter
    @Column(nullable = false)
    private Integer attemptCount = 0;

    @Setter
    @Column(nullable = false)
    private LocalDateTime startedAt;

    @Setter
    private LocalDateTime completedAt;

    public Game() {
    }

    public Long getId() {
        return id;
    }

    public Long getVersion() {
        return version;
    }

    public User getUser() {
        return user;
    }

    public Word getWord() {
        return word;
    }

    public GameType getGameType() {
        return gameType;
    }

    public GameStatus getStatus() {
        return status;
    }

    public Integer getAttemptCount() {
        return attemptCount;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
}