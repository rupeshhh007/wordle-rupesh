package com.wordlearena.arena.repository;

import com.wordlearena.arena.entity.ArenaMatch;
import com.wordlearena.arena.entity.ArenaMatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArenaMatchRepository
        extends JpaRepository<ArenaMatch, Long> {

    Optional<ArenaMatch> findFirstByStatusOrderByCreatedAtAsc(
            ArenaMatchStatus status
    );
}