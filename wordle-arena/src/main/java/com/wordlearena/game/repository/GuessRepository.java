package com.wordlearena.game.repository;

import com.wordlearena.game.entity.Game;
import com.wordlearena.game.entity.Guess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuessRepository extends JpaRepository<Guess, Long> {

    List<Guess> findByGameOrderByAttemptNumberAsc(Game game);

    boolean existsByGameAndAttemptNumber(
            Game game,
            Integer attemptNumber
    );
}