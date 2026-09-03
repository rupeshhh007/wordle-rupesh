package com.wordlearena.game.repository;

import com.wordlearena.game.entity.Game;
import com.wordlearena.game.entity.GameStatus;
import com.wordlearena.game.entity.GameType;
import com.wordlearena.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface GameRepository extends JpaRepository<Game, Long> {

    List<Game> findByUserOrderByStartedAtDesc(User user);

    Optional<Game> findByIdAndUser(Long id, User user);
    List<Game> findByUserAndStatusOrderByStartedAtAsc(
            User user,
            GameStatus status
    );

    Optional<Game> findByUserAndGameTypeAndGameDate(
            User user,
            GameType gameType,
            LocalDate gameDate
    );

    List<Game> findByUserAndGameTypeOrderByGameDateAsc(
            User user,
            GameType gameType
    );


}