package com.wordlearena.arena.repository;

import com.wordlearena.arena.entity.ArenaGuess;
import com.wordlearena.arena.entity.ArenaMatch;
import com.wordlearena.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArenaGuessRepository
        extends JpaRepository<ArenaGuess, Long> {

    List<ArenaGuess> findByMatchAndPlayerOrderByAttemptNumberAsc(
            ArenaMatch match,
            User player
    );
}