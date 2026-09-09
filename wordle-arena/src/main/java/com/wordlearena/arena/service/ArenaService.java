
package com.wordlearena.arena.service;

import com.wordlearena.arena.dto.ArenaGuessHistoryResponse;
import com.wordlearena.arena.dto.ArenaGuessResponse;
import com.wordlearena.arena.dto.ArenaMatchDetailsResponse;
import com.wordlearena.arena.dto.ArenaMatchResponse;
import com.wordlearena.arena.entity.ArenaGuess;
import com.wordlearena.arena.entity.ArenaMatch;
import com.wordlearena.arena.entity.ArenaMatchStatus;
import com.wordlearena.arena.entity.ArenaWinner;
import com.wordlearena.arena.repository.ArenaGuessRepository;
import com.wordlearena.arena.repository.ArenaMatchRepository;
import com.wordlearena.common.exception.ResourceForbiddenException;
import com.wordlearena.game.entity.Word;
import com.wordlearena.game.logic.LetterResult;
import com.wordlearena.game.repository.WordRepository;
import com.wordlearena.game.service.WordEvaluationService;
import com.wordlearena.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ArenaService {

    /**
     * WAITING matches older than this are considered expired.
     * No opponent joined within the window.
     */
    private static final int WAITING_EXPIRY_MINUTES = 5;

    /**
     * IN_PROGRESS matches older than this are considered
     * abandoned. Used for active-match queries.
     */
    private static final int IN_PROGRESS_EXPIRY_MINUTES = 30;

    private final ArenaMatchRepository arenaMatchRepository;
    private final ArenaGuessRepository arenaGuessRepository;
    private final WordRepository wordRepository;
    private final WordEvaluationService wordEvaluationService;
    private final ArenaRatingService arenaRatingService;

    public ArenaService(
            ArenaMatchRepository arenaMatchRepository,
            ArenaGuessRepository arenaGuessRepository,
            WordRepository wordRepository,
            WordEvaluationService wordEvaluationService,
            ArenaRatingService arenaRatingService) {

        this.arenaMatchRepository = arenaMatchRepository;
        this.arenaGuessRepository = arenaGuessRepository;
        this.wordRepository = wordRepository;
        this.wordEvaluationService = wordEvaluationService;
        this.arenaRatingService = arenaRatingService;
    }

    @Transactional
    public ArenaMatchResponse findOrCreateMatch(User user) {

        LocalDateTime waitingCutoff =
                LocalDateTime.now().minusMinutes(
                        WAITING_EXPIRY_MINUTES
                );

        /*
         * Step 1: Cancel any stale WAITING matches
         * created by this user (older than 5 min).
         * Prevents orphan match accumulation.
         */
        arenaMatchRepository.cancelStaleWaitingMatchesForUser(
                user,
                ArenaMatchStatus.WAITING,
                waitingCutoff
        );

        /*
         * Step 2: Check if the user already has a
         * fresh WAITING match. If so, reuse it
         * instead of creating a duplicate.
         */
        java.util.Optional<ArenaMatch> ownMatch =
                arenaMatchRepository.findUserOwnWaitingMatch(
                        ArenaMatchStatus.WAITING,
                        user,
                        waitingCutoff
                );

        if (ownMatch.isPresent()) {
            return toResponse(ownMatch.get());
        }

        /*
         * Step 3: Look for another player's fresh
         * WAITING match to join.
         */
        java.util.Optional<ArenaMatch> joinable =
                arenaMatchRepository.findJoinableMatch(
                        ArenaMatchStatus.WAITING,
                        waitingCutoff,
                        user
                );

        if (joinable.isPresent()) {
            ArenaMatch waitingMatch = joinable.get();

            waitingMatch.setPlayer2(user);

            waitingMatch.setStatus(
                    ArenaMatchStatus.IN_PROGRESS
            );

            waitingMatch.setStartedAt(
                    LocalDateTime.now()
            );

            arenaMatchRepository.save(waitingMatch);

            return toResponse(waitingMatch);
        }

        /*
         * Step 4: No suitable match exists.
         * Create a new one.
         */
        Word word =
                wordRepository
                        .findRandomAnswerEligibleWord()
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "No answer-eligible words available"
                                ));

        ArenaMatch newMatch = new ArenaMatch();

        newMatch.setPlayer1(user);
        newMatch.setWord(word);

        newMatch.setStatus(
                ArenaMatchStatus.WAITING
        );

        newMatch.setWinner(null);

        newMatch.setPlayer1Attempts(0);
        newMatch.setPlayer2Attempts(0);

        newMatch.setRatingUpdated(false);

        newMatch.setCreatedAt(
                LocalDateTime.now()
        );

        arenaMatchRepository.save(newMatch);

        return toResponse(newMatch);
    }

    @Transactional(readOnly = true)
    public ArenaMatchResponse getMatch(
            Long matchId,
            User user) {

        ArenaMatch match =
                getMatchForUser(matchId, user);

        return toResponse(match);
    }

    @Transactional(readOnly = true)
    public ArenaMatchDetailsResponse getMatchDetails(
            Long matchId,
            User user) {

        ArenaMatch match =
                getMatchForUser(matchId, user);

        boolean isCompleted = isCompletedStatus(match.getStatus());
        boolean isPlayer1 = match.getPlayer1().getId().equals(user.getId());

        List<ArenaGuessHistoryResponse> player1Guesses =
                arenaGuessRepository
                        .findByMatchAndPlayerOrderByAttemptNumberAsc(
                                match,
                                match.getPlayer1()
                        )
                        .stream()
                        .map(g -> toGuessHistoryResponse(g, !isPlayer1 && !isCompleted))
                        .toList();

        List<ArenaGuessHistoryResponse> player2Guesses =
                match.getPlayer2() == null
                        ? List.of()
                        : arenaGuessRepository
                        .findByMatchAndPlayerOrderByAttemptNumberAsc(
                                match,
                                match.getPlayer2()
                        )
                        .stream()
                        .map(g -> toGuessHistoryResponse(g, isPlayer1 && !isCompleted))
                        .toList();

        return new ArenaMatchDetailsResponse(
                match.getId(),

                match.getPlayer1().getUsername(),

                match.getPlayer2() != null
                        ? match.getPlayer2().getUsername()
                        : null,

                match.getStatus(),

                match.getWinner(),

                match.getPlayer1Attempts(),

                match.getPlayer2Attempts(),

                player1Guesses,

                player2Guesses,

                match.getCreatedAt(),

                match.getStartedAt(),

                match.getCompletedAt()
        );
    }

    @Transactional
    public ArenaGuessResponse submitGuess(
            Long matchId,
            String rawGuess,
            User user) {

        ArenaMatch match =
                getMatchForUser(matchId, user);

        /*
         * Only players in an active match
         * can submit guesses.
         */
        if (match.getStatus()
                != ArenaMatchStatus.IN_PROGRESS) {

            throw new IllegalStateException(
                    "Arena match is not in progress"
            );
        }

        String guess =
                rawGuess
                        .trim()
                        .toLowerCase();

        /*
         * Validate guess format.
         */
        if (!guess.matches("[a-z]{5}")) {

            throw new IllegalArgumentException(
                    "Guess must contain exactly 5 letters"
            );
        }

        /*
         * Validate against dictionary.
         */
        if (!wordRepository
                .existsByWordAndActiveTrue(guess)) {

            throw new IllegalArgumentException(
                    "Word is not in dictionary"
            );
        }

        boolean player1 =
                match.getPlayer1()
                        .getId()
                        .equals(user.getId());

        int attemptNumber =
                player1
                        ? match.getPlayer1Attempts() + 1
                        : match.getPlayer2Attempts() + 1;

        /*
         * Maximum six attempts per player.
         */
        if (attemptNumber > 6) {

            throw new IllegalStateException(
                    "Maximum attempts reached"
            );
        }

        /*
         * Evaluate the guess using the same
         * duplicate-safe evaluator used by
         * normal Wordle games.
         */
        LetterResult[] result =
                wordEvaluationService.evaluate(
                        match.getWord().getWord(),
                        guess
                );

        /*
         * Store Arena guess.
         */
        ArenaGuess arenaGuess =
                new ArenaGuess();

        arenaGuess.setMatch(match);
        arenaGuess.setPlayer(user);
        arenaGuess.setGuess(guess);
        arenaGuess.setAttemptNumber(attemptNumber);

        arenaGuess.setResult(
                resultToString(result)
        );

        arenaGuess.setCreatedAt(
                LocalDateTime.now()
        );

        arenaGuessRepository.save(arenaGuess);

        /*
         * Update attempt count.
         */
        if (player1) {

            match.setPlayer1Attempts(
                    attemptNumber
            );

        } else {

            match.setPlayer2Attempts(
                    attemptNumber
            );
        }

        /*
         * Check whether this player solved
         * the word.
         */
        boolean won =
                isCorrect(result);

        if (won) {

            match.setWinner(
                    player1
                            ? ArenaWinner.PLAYER1
                            : ArenaWinner.PLAYER2
            );

            match.setStatus(
                    player1
                            ? ArenaMatchStatus.PLAYER1_WON
                            : ArenaMatchStatus.PLAYER2_WON
            );

            match.setCompletedAt(
                    LocalDateTime.now()
            );
        }

        /*
         * Both players used all six attempts
         * without solving the word.
         */
        else if (
                match.getPlayer1Attempts() >= 6
                        && match.getPlayer2Attempts() >= 6
        ) {

            match.setWinner(
                    ArenaWinner.DRAW
            );

            match.setStatus(
                    ArenaMatchStatus.DRAW
            );

            match.setCompletedAt(
                    LocalDateTime.now()
            );
        }

        /*
         * Update ratings only when the match
         * has reached a terminal state.
         *
         * ratingUpdated protects against
         * duplicate rating application.
         */
        if (!match.isRatingUpdated()
                && isCompletedStatus(match.getStatus())) {

            arenaRatingService.updateRatings(match);

            match.setRatingUpdated(true);
        }

        /*
         * Persist match state and ratingUpdated
         * flag in the same transaction.
         */
        arenaMatchRepository.save(match);

        return new ArenaGuessResponse(
                guess,
                result,
                attemptNumber,
                match.getStatus()
        );
    }

    @Transactional
    public ArenaMatchResponse cancelMatch(
            Long matchId,
            User user) {

        ArenaMatch match =
                getMatchForUser(matchId, user);

        if (match.getStatus()
                != ArenaMatchStatus.WAITING) {

            throw new IllegalStateException(
                    "Only waiting matches can be cancelled"
            );
        }

        match.setStatus(
                ArenaMatchStatus.CANCELLED
        );

        match.setCompletedAt(
                LocalDateTime.now()
        );

        /*
         * Cancelled matches never receive
         * rating changes.
         */
        match.setRatingUpdated(false);

        arenaMatchRepository.save(match);

        return toResponse(match);
    }

    private ArenaMatch getMatchForUser(
            Long matchId,
            User user) {

        ArenaMatch match =
                arenaMatchRepository
                        .findById(matchId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Arena match not found"
                                ));

        boolean isPlayer1 =
                match.getPlayer1()
                        .getId()
                        .equals(user.getId());

        boolean isPlayer2 =
                match.getPlayer2() != null
                        && match.getPlayer2()
                        .getId()
                        .equals(user.getId());

        if (!isPlayer1 && !isPlayer2) {

            throw new ResourceForbiddenException(
                    "You are not part of this Arena match"
            );
        }

        return match;
    }

    private ArenaGuessHistoryResponse toGuessHistoryResponse(
            ArenaGuess guess,
            boolean maskWord) {

        String[] resultStrings =
                guess.getResult().split(",");

        LetterResult[] results =
                new LetterResult[resultStrings.length];

        for (int i = 0;
             i < resultStrings.length;
             i++) {

            results[i] =
                    LetterResult.valueOf(
                            resultStrings[i]
                    );
        }

        return new ArenaGuessHistoryResponse(
                maskWord ? "" : guess.getGuess(),
                results,
                guess.getAttemptNumber()
        );
    }

    private boolean isCorrect(
            LetterResult[] result) {

        for (LetterResult letter : result) {

            if (letter != LetterResult.CORRECT) {
                return false;
            }
        }

        return true;
    }

    private String resultToString(
            LetterResult[] result) {

        StringBuilder builder =
                new StringBuilder();

        for (LetterResult letter : result) {

            if (builder.length() > 0) {
                builder.append(",");
            }

            builder.append(letter.name());
        }

        return builder.toString();
    }

    private boolean isCompletedStatus(
            ArenaMatchStatus status) {

        return status == ArenaMatchStatus.PLAYER1_WON
                || status == ArenaMatchStatus.PLAYER2_WON
                || status == ArenaMatchStatus.DRAW;
    }

    @Transactional
    public java.util.Optional<ArenaMatchResponse> findActiveMatch(User user) {

        /*
         * Clean up stale WAITING matches for this user
         * before looking for active ones.
         */
        LocalDateTime waitingCutoff =
                LocalDateTime.now().minusMinutes(
                        WAITING_EXPIRY_MINUTES
                );

        arenaMatchRepository.cancelStaleWaitingMatchesForUser(
                user,
                ArenaMatchStatus.WAITING,
                waitingCutoff
        );

        /*
         * Use the broader cutoff for IN_PROGRESS
         * (opponent may still be playing).
         */
        LocalDateTime activeCutoff =
                LocalDateTime.now().minusMinutes(
                        IN_PROGRESS_EXPIRY_MINUTES
                );

        return arenaMatchRepository.findActiveMatchesForUser(
                user,
                java.util.List.of(
                        ArenaMatchStatus.WAITING,
                        ArenaMatchStatus.IN_PROGRESS
                ),
                activeCutoff
        ).stream().findFirst().map(this::toResponse);
    }

    @Transactional
    public ArenaMatchResponse forfeitMatch(
            Long matchId,
            User user) {

        ArenaMatch match =
                getMatchForUser(matchId, user);

        if (match.getStatus()
                != ArenaMatchStatus.IN_PROGRESS) {

            throw new IllegalStateException(
                    "Only in-progress matches can be forfeited"
            );
        }

        boolean isPlayer1 =
                match.getPlayer1()
                        .getId()
                        .equals(user.getId());

        /*
         * The forfeiting player loses;
         * the opponent wins.
         */
        match.setWinner(
                isPlayer1
                        ? ArenaWinner.PLAYER2
                        : ArenaWinner.PLAYER1
        );

        match.setStatus(
                isPlayer1
                        ? ArenaMatchStatus.PLAYER2_WON
                        : ArenaMatchStatus.PLAYER1_WON
        );

        match.setCompletedAt(
                LocalDateTime.now()
        );

        if (!match.isRatingUpdated()) {
            arenaRatingService.updateRatings(match);
            match.setRatingUpdated(true);
        }

        arenaMatchRepository.save(match);

        return toResponse(match);
    }

    private ArenaMatchResponse toResponse(
            ArenaMatch match) {

        return new ArenaMatchResponse(
                match.getId(),

                match.getPlayer1().getUsername(),

                match.getPlayer2() == null
                        ? null
                        : match.getPlayer2().getUsername(),

                match.getStatus(),

                match.getWinner(),

                match.getPlayer1Attempts(),

                match.getPlayer2Attempts(),

                match.getCreatedAt(),

                match.getStartedAt(),

                match.getCompletedAt()
        );
    }
}
