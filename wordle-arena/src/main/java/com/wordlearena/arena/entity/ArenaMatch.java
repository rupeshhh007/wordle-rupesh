package com.wordlearena.arena.entity;

import com.wordlearena.game.entity.Word;
import com.wordlearena.user.entity.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "arena_matches",
        indexes = {
                @Index(
                        name = "idx_arena_player1",
                        columnList = "player1_id"
                ),
                @Index(
                        name = "idx_arena_player2",
                        columnList = "player2_id"
                ),
                @Index(
                        name = "idx_arena_status",
                        columnList = "status"
                )
        }
)
public class ArenaMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player1_id", nullable = false)
    private User player1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player2_id")
    private User player2;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "word_id", nullable = false)
    private Word word;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ArenaMatchStatus status;

    @Enumerated(EnumType.STRING)
    private ArenaWinner winner;

    @Column(nullable = false)
    private Integer player1Attempts = 0;

    @Column(nullable = false)
    private Integer player2Attempts = 0;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @Column(nullable = false)
    private boolean ratingUpdated = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isPrivate = false;

    @Column(length = 16)
    private String inviteCode;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean rematchRequestedByPlayer1 = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean rematchRequestedByPlayer2 = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenged_user_id")
    private User challengedUser;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean lobbyClosed = false;

    @Column(length = 64)
    private String playerLeft;

    private Long nextMatchId;

    @Version
    private Long version;

    public ArenaMatch() {
    }

    public Long getId() {
        return id;
    }

    public User getPlayer1() {
        return player1;
    }

    public void setPlayer1(User player1) {
        this.player1 = player1;
    }

    public User getPlayer2() {
        return player2;
    }

    public void setPlayer2(User player2) {
        this.player2 = player2;
    }

    public Word getWord() {
        return word;
    }

    public void setWord(Word word) {
        this.word = word;
    }

    public ArenaMatchStatus getStatus() {
        return status;
    }

    public void setStatus(ArenaMatchStatus status) {
        this.status = status;
    }

    public ArenaWinner getWinner() {
        return winner;
    }

    public void setWinner(ArenaWinner winner) {
        this.winner = winner;
    }

    public Integer getPlayer1Attempts() {
        return player1Attempts;
    }

    public void setPlayer1Attempts(Integer player1Attempts) {
        this.player1Attempts = player1Attempts;
    }

    public Integer getPlayer2Attempts() {
        return player2Attempts;
    }

    public void setPlayer2Attempts(Integer player2Attempts) {
        this.player2Attempts = player2Attempts;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public boolean isRatingUpdated() {
        return ratingUpdated;
    }

    public void setRatingUpdated(boolean ratingUpdated) {
        this.ratingUpdated = ratingUpdated;
    }

    public boolean isPrivate() {
        return isPrivate;
    }

    public void setPrivate(boolean aPrivate) {
        isPrivate = aPrivate;
    }

    public String getInviteCode() {
        return inviteCode;
    }

    public void setInviteCode(String inviteCode) {
        this.inviteCode = inviteCode;
    }

    public boolean isRematchRequestedByPlayer1() {
        return rematchRequestedByPlayer1;
    }

    public void setRematchRequestedByPlayer1(boolean rematchRequestedByPlayer1) {
        this.rematchRequestedByPlayer1 = rematchRequestedByPlayer1;
    }

    public boolean isRematchRequestedByPlayer2() {
        return rematchRequestedByPlayer2;
    }

    public void setRematchRequestedByPlayer2(boolean rematchRequestedByPlayer2) {
        this.rematchRequestedByPlayer2 = rematchRequestedByPlayer2;
    }

    public Long getNextMatchId() {
        return nextMatchId;
    }

    public void setNextMatchId(Long nextMatchId) {
        this.nextMatchId = nextMatchId;
    }

    public User getChallengedUser() {
        return challengedUser;
    }

    public void setChallengedUser(User challengedUser) {
        this.challengedUser = challengedUser;
    }

    public boolean isLobbyClosed() {
        return lobbyClosed;
    }

    public void setLobbyClosed(boolean lobbyClosed) {
        this.lobbyClosed = lobbyClosed;
    }

    public String getPlayerLeft() {
        return playerLeft;
    }

    public void setPlayerLeft(String playerLeft) {
        this.playerLeft = playerLeft;
    }

    public Long getVersion() {
        return version;
    }
}

