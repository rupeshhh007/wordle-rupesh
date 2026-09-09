package com.wordlearena.arena.repository;

import com.wordlearena.arena.entity.ArenaMatch;
import com.wordlearena.arena.entity.ArenaMatchStatus;
import com.wordlearena.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ArenaMatchRepository
        extends JpaRepository<ArenaMatch, Long> {

    Optional<ArenaMatch> findFirstByStatusOrderByCreatedAtAsc(
            ArenaMatchStatus status
    );

    /**
     * Find the oldest WAITING match created after the cutoff time
     * that does NOT belong to the given user.
     * This ensures we only join fresh, non-expired matches.
     */
    @Query("""
        SELECT m FROM ArenaMatch m
        WHERE m.status = :status
          AND m.isPrivate = false
          AND m.createdAt > :cutoff
          AND m.player1 <> :user
        ORDER BY m.createdAt ASC
        LIMIT 1
    """)
    Optional<ArenaMatch> findJoinableMatch(
            @Param("status") ArenaMatchStatus status,
            @Param("cutoff") LocalDateTime cutoff,
            @Param("user") User user
    );

    /**
     * Find the user's own WAITING match created after the cutoff.
     * Used to reuse an existing waiting match instead of creating
     * a duplicate.
     */
    @Query("""
        SELECT m FROM ArenaMatch m
        WHERE m.status = :status
          AND m.isPrivate = false
          AND m.player1 = :user
          AND m.createdAt > :cutoff
        ORDER BY m.createdAt DESC
        LIMIT 1
    """)
    Optional<ArenaMatch> findUserOwnWaitingMatch(
            @Param("status") ArenaMatchStatus status,
            @Param("user") User user,
            @Param("cutoff") LocalDateTime cutoff
    );

    /**
     * Bulk-cancel stale WAITING matches for a specific user
     * (created before the cutoff).
     */
    @Modifying
    @Query("""
        UPDATE ArenaMatch m
        SET m.status = 'CANCELLED',
            m.completedAt = CURRENT_TIMESTAMP
        WHERE m.player1 = :user
          AND m.status = :status
          AND m.createdAt < :cutoff
    """)
    int cancelStaleWaitingMatchesForUser(
            @Param("user") User user,
            @Param("status") ArenaMatchStatus status,
            @Param("cutoff") LocalDateTime cutoff
    );

    @Query("""
        SELECT m FROM ArenaMatch m
        WHERE (m.player1 = :user OR m.player2 = :user)
          AND m.status IN :statuses
          AND m.createdAt > :cutoff
        ORDER BY m.createdAt DESC
    """)
    List<ArenaMatch> findActiveMatchesForUser(
            @Param("user") User user,
            @Param("statuses") Collection<ArenaMatchStatus> statuses,
            @Param("cutoff") LocalDateTime cutoff
    );

    @Query("""
        SELECT m FROM ArenaMatch m
        WHERE m.status = :status
          AND m.isPrivate = false
          AND m.startedAt > :cutoff
        ORDER BY m.startedAt DESC
    """)
    List<ArenaMatch> findLiveMatches(
            @Param("status") ArenaMatchStatus status,
            @Param("cutoff") LocalDateTime cutoff
    );

    Optional<ArenaMatch> findByInviteCode(String inviteCode);

    boolean existsByInviteCode(String inviteCode);

    @Modifying
    @Query("""
        UPDATE ArenaMatch m
        SET m.status = 'CANCELLED',
            m.completedAt = CURRENT_TIMESTAMP
        WHERE m.player1 = :user
          AND m.status = 'WAITING'
          AND m.isPrivate = true
    """)
    int cancelWaitingPrivateMatchesForUser(@Param("user") User user);

    /**
     * Find all non-WAITING arena matches for a user (for game history).
     */
    @Query("""
        SELECT m FROM ArenaMatch m
        WHERE (m.player1 = :user OR m.player2 = :user)
          AND m.status <> 'WAITING'
        ORDER BY COALESCE(m.startedAt, m.createdAt) DESC
    """)
    List<ArenaMatch> findMatchesForUser(@Param("user") User user);

    /**
     * Find all finished/completed arena matches for a user (for stats calculation).
     */
    @Query("""
        SELECT m FROM ArenaMatch m
        WHERE (m.player1 = :user OR m.player2 = :user)
          AND m.status IN :statuses
        ORDER BY m.completedAt ASC
    """)
    List<ArenaMatch> findCompletedMatchesForUser(
            @Param("user") User user,
            @Param("statuses") Collection<ArenaMatchStatus> statuses
    );

    /**
     * Count finished/completed arena matches for a user (for provisional rating calculation).
     */
    @Query("""
        SELECT COUNT(m) FROM ArenaMatch m
        WHERE (m.player1 = :user OR m.player2 = :user)
          AND m.status IN :statuses
    """)
    long countCompletedMatchesForUser(
            @Param("user") User user,
            @Param("statuses") Collection<ArenaMatchStatus> statuses
    );
}