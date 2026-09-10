
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
import com.wordlearena.user.repository.UserRepository;
import com.wordlearena.websocket.dto.ChallengeEventDto;
import com.wordlearena.websocket.service.ArenaWebSocketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
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
     * Private lobby WAITING matches older than this are considered expired.
     */
    private static final int PRIVATE_LOBBY_EXPIRY_MINUTES = 15;

    /**
     * IN_PROGRESS matches older than this are considered
     * abandoned. Used for active-match queries.
     */
    private static final int IN_PROGRESS_EXPIRY_MINUTES = 30;

    /**
     * Arena match duration limit in seconds (3 minutes).
     */
    public static final int ARENA_MATCH_DURATION_SECONDS = 180;

    private static final String INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ArenaMatchRepository arenaMatchRepository;
    private final ArenaGuessRepository arenaGuessRepository;
    private final WordRepository wordRepository;
    private final WordEvaluationService wordEvaluationService;
    private final ArenaRatingService arenaRatingService;
    private final UserRepository userRepository;
    private final ArenaWebSocketService webSocketService;

    @Autowired
    public ArenaService(
            ArenaMatchRepository arenaMatchRepository,
            ArenaGuessRepository arenaGuessRepository,
            WordRepository wordRepository,
            WordEvaluationService wordEvaluationService,
            ArenaRatingService arenaRatingService,
            UserRepository userRepository,
            ArenaWebSocketService webSocketService) {

        this.arenaMatchRepository = arenaMatchRepository;
        this.arenaGuessRepository = arenaGuessRepository;
        this.wordRepository = wordRepository;
        this.wordEvaluationService = wordEvaluationService;
        this.arenaRatingService = arenaRatingService;
        this.userRepository = userRepository;
        this.webSocketService = webSocketService;
    }

    public ArenaService(
            ArenaMatchRepository arenaMatchRepository,
            ArenaGuessRepository arenaGuessRepository,
            WordRepository wordRepository,
            WordEvaluationService wordEvaluationService,
            ArenaRatingService arenaRatingService) {

        this(arenaMatchRepository, arenaGuessRepository, wordRepository, wordEvaluationService, arenaRatingService, null, null);
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

            ArenaMatchResponse response = toResponse(waitingMatch);
            if (webSocketService != null) {
                webSocketService.broadcastMatchUpdate(
                        waitingMatch.getId(),
                        "MATCH_STARTED",
                        response,
                        user.getUsername(),
                        null,
                        null,
                        "Opponent joined! Match started"
                );
            }

            return response;
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

    @Transactional
    public ArenaMatchResponse getMatch(
            Long matchId,
            User user) {

        ArenaMatch match = arenaMatchRepository
                .findById(matchId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Arena match not found"
                        ));

        if (match.getStatus() == ArenaMatchStatus.IN_PROGRESS && isMatchTimedOut(match)) {
            handleMatchTimeout(match);
        }

        return toResponse(match);
    }

    @Transactional
    public List<ArenaMatchResponse> getLiveMatches() {
        LocalDateTime cutoff =
                LocalDateTime.now().minusMinutes(
                        IN_PROGRESS_EXPIRY_MINUTES
                );

        List<ArenaMatch> liveMatches = arenaMatchRepository
                .findLiveMatches(
                        ArenaMatchStatus.IN_PROGRESS,
                        cutoff
                );

        List<ArenaMatchResponse> result = new java.util.ArrayList<>();
        for (ArenaMatch match : liveMatches) {
            if (isMatchTimedOut(match)) {
                handleMatchTimeout(match);
            } else {
                result.add(toResponse(match));
            }
        }
        return result;
    }

    @Transactional
    public ArenaMatchDetailsResponse getMatchDetails(
            Long matchId,
            User user) {

        ArenaMatch match = arenaMatchRepository
                .findById(matchId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Arena match not found"
                        ));

        if (match.getStatus() == ArenaMatchStatus.IN_PROGRESS && isMatchTimedOut(match)) {
            handleMatchTimeout(match);
        }

        boolean isCompleted = isCompletedStatus(match.getStatus());
        boolean isPlayer1 = match.getPlayer1().getId().equals(user.getId());
        boolean isPlayer2 = match.getPlayer2() != null && match.getPlayer2().getId().equals(user.getId());
        boolean isSpectator = !isPlayer1 && !isPlayer2;

        boolean maskP1 = !isSpectator && !isPlayer1 && !isCompleted;
        boolean maskP2 = !isSpectator && !isPlayer2 && !isCompleted;

        List<ArenaGuessHistoryResponse> player1Guesses =
                arenaGuessRepository
                        .findByMatchAndPlayerOrderByAttemptNumberAsc(
                                match,
                                match.getPlayer1()
                        )
                        .stream()
                        .map(g -> toGuessHistoryResponse(g, maskP1))
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
                        .map(g -> toGuessHistoryResponse(g, maskP2))
                        .toList();

        boolean isTerminal = isCompletedStatus(match.getStatus()) || match.getStatus() == ArenaMatchStatus.CANCELLED;
        String solutionWord = isTerminal && match.getWord() != null ? match.getWord().getWord() : null;
        int remainingSeconds = calculateRemainingSeconds(match);

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

                match.getCompletedAt(),

                match.isPrivate(),

                match.getInviteCode(),

                match.isRematchRequestedByPlayer1(),

                match.isRematchRequestedByPlayer2(),

                match.getNextMatchId(),

                solutionWord,

                ARENA_MATCH_DURATION_SECONDS,

                remainingSeconds
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
         * Check if match time has expired (3-minute limit).
         */
        if (match.getStatus() == ArenaMatchStatus.IN_PROGRESS && isMatchTimedOut(match)) {
            handleMatchTimeout(match);
            throw new IllegalStateException(
                    "Match time limit expired! Match ended in a draw."
            );
        }

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

        if (webSocketService != null) {
            String eventType = isCompletedStatus(match.getStatus()) ? "MATCH_COMPLETED" : "GUESS_SUBMITTED";
            webSocketService.broadcastMatchUpdate(
                    match.getId(),
                    eventType,
                    toResponse(match),
                    user.getUsername(),
                    attemptNumber,
                    List.of(result),
                    isCompletedStatus(match.getStatus()) ? "Match completed" : "New guess submitted"
            );
        }

        boolean isTerminal = isCompletedStatus(match.getStatus()) || match.getStatus() == ArenaMatchStatus.CANCELLED;
        String solutionWord = isTerminal && match.getWord() != null ? match.getWord().getWord() : null;

        return new ArenaGuessResponse(
                guess,
                result,
                attemptNumber,
                match.getStatus(),
                solutionWord
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

        ArenaMatchResponse response = toResponse(match);
        if (webSocketService != null) {
            webSocketService.broadcastMatchUpdate(
                    match.getId(),
                    "MATCH_CANCELLED",
                    response,
                    user.getUsername(),
                    null,
                    null,
                    "Match was cancelled"
            );
        }

        return response;
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

    public boolean isMatchTimedOut(ArenaMatch match) {
        return isMatchTimedOut(match, 0);
    }

    public boolean isMatchTimedOut(ArenaMatch match, long toleranceSeconds) {
        if (match.getStatus() != ArenaMatchStatus.IN_PROGRESS) {
            return false;
        }
        LocalDateTime startTime = match.getStartedAt() != null ? match.getStartedAt() : match.getCreatedAt();
        if (startTime == null) {
            return false;
        }
        long elapsedSeconds = java.time.Duration.between(startTime, LocalDateTime.now()).getSeconds();
        return elapsedSeconds >= (ARENA_MATCH_DURATION_SECONDS - toleranceSeconds);
    }

    public int calculateRemainingSeconds(ArenaMatch match) {
        if (match.getStatus() != ArenaMatchStatus.IN_PROGRESS) {
            return 0;
        }
        LocalDateTime startTime = match.getStartedAt() != null ? match.getStartedAt() : match.getCreatedAt();
        if (startTime == null) {
            return ARENA_MATCH_DURATION_SECONDS;
        }
        long elapsedSeconds = java.time.Duration.between(startTime, LocalDateTime.now()).getSeconds();
        long remaining = ARENA_MATCH_DURATION_SECONDS - elapsedSeconds;
        return (int) Math.max(0, remaining);
    }

    public void handleMatchTimeout(ArenaMatch match) {
        if (match.getStatus() != ArenaMatchStatus.IN_PROGRESS) {
            return;
        }

        match.setWinner(ArenaWinner.DRAW);
        match.setStatus(ArenaMatchStatus.DRAW);
        match.setCompletedAt(LocalDateTime.now());

        if (!match.isRatingUpdated()) {
            arenaRatingService.updateRatings(match);
            match.setRatingUpdated(true);
        }

        arenaMatchRepository.save(match);

        if (webSocketService != null) {
            ArenaMatchResponse response = toResponse(match);
            webSocketService.broadcastMatchUpdate(
                    match.getId(),
                    "MATCH_COMPLETED",
                    response,
                    null,
                    null,
                    null,
                    "Time expired! Match ended in a draw."
            );
        }
    }

    @Transactional
    public ArenaMatchResponse timeoutMatch(Long matchId, User user) {
        ArenaMatch match = getMatchForUser(matchId, user);
        if (match.getStatus() == ArenaMatchStatus.IN_PROGRESS && isMatchTimedOut(match, 2)) {
            handleMatchTimeout(match);
        }
        return toResponse(match);
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

        java.util.Optional<ArenaMatch> activeOpt = arenaMatchRepository.findActiveMatchesForUser(
                user,
                java.util.List.of(
                        ArenaMatchStatus.WAITING,
                        ArenaMatchStatus.IN_PROGRESS
                ),
                activeCutoff
        ).stream().findFirst();

        if (activeOpt.isPresent()) {
            ArenaMatch match = activeOpt.get();
            if (match.getStatus() == ArenaMatchStatus.IN_PROGRESS && isMatchTimedOut(match)) {
                handleMatchTimeout(match);
                return java.util.Optional.empty();
            }
            return java.util.Optional.of(toResponse(match));
        }

        return java.util.Optional.empty();
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

        ArenaMatchResponse response = toResponse(match);
        if (webSocketService != null) {
            webSocketService.broadcastMatchUpdate(
                    match.getId(),
                    "MATCH_FORFEITED",
                    response,
                    user.getUsername(),
                    null,
                    null,
                    user.getUsername() + " forfeited the match"
            );
        }

        return response;
    }

    @Transactional
    public ArenaMatchResponse createPrivateMatch(User user) {
        return createPrivateMatch(user, null);
    }

    @Transactional
    public ArenaMatchResponse createPrivateMatch(User user, User challengedUser) {
        // Cancel any existing WAITING private matches created by this user
        arenaMatchRepository.cancelWaitingPrivateMatchesForUser(user);

        Word word = wordRepository
                .findRandomAnswerEligibleWord()
                .orElseThrow(() -> new IllegalStateException("No answer-eligible words available"));

        String inviteCode = generateUniqueInviteCode();

        ArenaMatch match = new ArenaMatch();
        match.setPlayer1(user);
        match.setChallengedUser(challengedUser);
        match.setWord(word);
        match.setStatus(ArenaMatchStatus.WAITING);
        match.setWinner(null);
        match.setPlayer1Attempts(0);
        match.setPlayer2Attempts(0);
        match.setRatingUpdated(false);
        match.setCreatedAt(LocalDateTime.now());
        match.setPrivate(true);
        match.setInviteCode(inviteCode);

        arenaMatchRepository.save(match);
        return toResponse(match);
    }

    @Transactional
    public ArenaMatchResponse joinPrivateMatch(String inviteCode, User user) {
        if (inviteCode == null || inviteCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Invite code cannot be blank");
        }

        String normalizedCode = inviteCode.trim().toUpperCase();

        ArenaMatch match = arenaMatchRepository
                .findByInviteCode(normalizedCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid room code. Room not found."));

        // If the host joins their own room, return it cleanly
        if (match.getPlayer1().getId().equals(user.getId())) {
            return toResponse(match);
        }

        if (match.getChallengedUser() != null
                && !match.getChallengedUser().getId().equals(user.getId())) {
            throw new ResourceForbiddenException("Only the challenged player can join this private match.");
        }

        if (match.getStatus() == ArenaMatchStatus.CANCELLED) {
            throw new IllegalStateException("This private room was cancelled by the host.");
        }

        if (match.getStatus() != ArenaMatchStatus.WAITING) {
            // Check if this user is already player2
            if (match.getPlayer2() != null && match.getPlayer2().getId().equals(user.getId())) {
                return toResponse(match);
            }
            throw new IllegalStateException("This private match has already started or concluded.");
        }

        // Check if the match has expired (> 15 minutes)
        if (match.getCreatedAt().isBefore(LocalDateTime.now().minusMinutes(PRIVATE_LOBBY_EXPIRY_MINUTES))) {
            match.setStatus(ArenaMatchStatus.CANCELLED);
            match.setCompletedAt(LocalDateTime.now());
            arenaMatchRepository.save(match);
            throw new IllegalStateException("This room code has expired. Please ask the host for a new invite.");
        }

        match.setPlayer2(user);
        match.setStatus(ArenaMatchStatus.IN_PROGRESS);
        match.setStartedAt(LocalDateTime.now());

        arenaMatchRepository.save(match);

        ArenaMatchResponse response = toResponse(match);
        if (webSocketService != null) {
            webSocketService.broadcastMatchUpdate(
                    match.getId(),
                    "MATCH_STARTED",
                    response,
                    user.getUsername(),
                    null,
                    null,
                    "Friend joined! Match started"
            );
        }

        return response;
    }

    private String generateUniqueInviteCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(INVITE_CHARS.charAt(RANDOM.nextInt(INVITE_CHARS.length())));
            }
            String code = sb.toString();
            if (!arenaMatchRepository.existsByInviteCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Failed to generate unique invite code");
    }

    @Transactional
    public ArenaMatchResponse requestRematch(Long matchId, User user) {
        ArenaMatch match = getMatchForUser(matchId, user);

        if (!match.isPrivate()) {
            throw new IllegalStateException("Rematch is only available for private lobbies");
        }

        if (!isCompletedStatus(match.getStatus())) {
            throw new IllegalStateException("Cannot request a rematch until the current match is finished");
        }

        // If a new match was already generated (e.g. by concurrent accept), return immediately
        if (match.getNextMatchId() != null) {
            return toResponse(match);
        }

        boolean isPlayer1 = match.getPlayer1().getId().equals(user.getId());
        if (isPlayer1) {
            match.setRematchRequestedByPlayer1(true);
        } else {
            match.setRematchRequestedByPlayer2(true);
        }

        if (match.isRematchRequestedByPlayer1() && match.isRematchRequestedByPlayer2()) {
            // Both players agreed to rematch!
            Word word = wordRepository
                    .findRandomAnswerEligibleWord()
                    .orElseThrow(() -> new IllegalStateException("No answer-eligible words available"));

            ArenaMatch newMatch = new ArenaMatch();
            newMatch.setPlayer1(match.getPlayer1());
            newMatch.setPlayer2(match.getPlayer2());
            newMatch.setWord(word);
            newMatch.setStatus(ArenaMatchStatus.IN_PROGRESS);
            newMatch.setWinner(null);
            newMatch.setPlayer1Attempts(0);
            newMatch.setPlayer2Attempts(0);
            newMatch.setRatingUpdated(false);
            newMatch.setCreatedAt(LocalDateTime.now());
            newMatch.setStartedAt(LocalDateTime.now());
            newMatch.setPrivate(true);
            newMatch.setInviteCode(match.getInviteCode());

            arenaMatchRepository.save(newMatch);

            match.setNextMatchId(newMatch.getId());
        }

        arenaMatchRepository.save(match);

        ArenaMatchResponse response = toResponse(match);
        if (webSocketService != null) {
            String eventType = match.getNextMatchId() != null ? "REMATCH_ACCEPTED" : "REMATCH_REQUESTED";
            webSocketService.broadcastMatchUpdate(
                    match.getId(),
                    eventType,
                    response,
                    user.getUsername(),
                    null,
                    null,
                    match.getNextMatchId() != null ? "Rematch starting!" : user.getUsername() + " wants a rematch"
            );
        }

        return response;
    }

    @Transactional
    public ArenaMatchResponse cancelRematch(Long matchId, User user) {
        ArenaMatch match = getMatchForUser(matchId, user);

        // If the match already started, cannot cancel
        if (match.getNextMatchId() != null) {
            return toResponse(match);
        }

        boolean isPlayer1 = match.getPlayer1().getId().equals(user.getId());
        if (isPlayer1) {
            match.setRematchRequestedByPlayer1(false);
        } else {
            match.setRematchRequestedByPlayer2(false);
        }

        arenaMatchRepository.save(match);

        ArenaMatchResponse response = toResponse(match);
        if (webSocketService != null) {
            webSocketService.broadcastMatchUpdate(
                    match.getId(),
                    "REMATCH_CANCELLED",
                    response,
                    user.getUsername(),
                    null,
                    null,
                    user.getUsername() + " cancelled rematch request"
            );
        }

        return response;
    }

    @Transactional
    public ArenaMatchResponse leaveLobby(Long matchId, User user) {
        ArenaMatch match = getMatchForUser(matchId, user);

        // Reset rematch request for BOTH users when someone leaves the lobby
        match.setRematchRequestedByPlayer1(false);
        match.setRematchRequestedByPlayer2(false);
        match.setLobbyClosed(true);
        match.setPlayerLeft(user.getUsername());

        // If match is in WAITING status (e.g. host leaves private room), cancel it
        if (match.getStatus() == ArenaMatchStatus.WAITING) {
            match.setStatus(ArenaMatchStatus.CANCELLED);
            match.setCompletedAt(LocalDateTime.now());
        }

        arenaMatchRepository.save(match);

        ArenaMatchResponse response = toResponse(match);
        if (webSocketService != null) {
            webSocketService.broadcastPlayerLeftLobby(match.getId(), user.getUsername(), response);
        }

        return response;
    }

    @Transactional
    public ArenaMatchResponse challengeUser(String targetUsername, User challenger) {
        if (challenger.getUsername().equalsIgnoreCase(targetUsername)) {
            throw new IllegalArgumentException("You cannot challenge yourself");
        }

        if (userRepository == null) {
            throw new IllegalStateException("User repository not available");
        }

        User targetUser = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found: " + targetUsername));

        ArenaMatchResponse match = createPrivateMatch(challenger, targetUser);

        if (webSocketService != null) {
            ChallengeEventDto challengeEvent = ChallengeEventDto.builder()
                    .type("CHALLENGE_RECEIVED")
                    .challenger(challenger.getUsername())
                    .challengerRating(challenger.getRating())
                    .targetUser(targetUser.getUsername())
                    .matchId(match.getId())
                    .inviteCode(match.getInviteCode())
                    .message(challenger.getUsername() + " challenged you to a 1v1 Arena Duel!")
                    .timestamp(System.currentTimeMillis())
                    .build();

            webSocketService.sendChallenge(targetUser.getUsername(), challengeEvent);
        }

        return match;
    }

    @Transactional
    public ArenaMatchResponse respondToChallenge(Long matchId, boolean accept, User targetUser) {
        ArenaMatch match = arenaMatchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        if (match.getChallengedUser() == null
                || !match.getChallengedUser().getId().equals(targetUser.getId())) {
            throw new ResourceForbiddenException("Only the challenged player can respond to this challenge.");
        }

        if (accept) {
            ArenaMatchResponse joined = joinPrivateMatch(match.getInviteCode(), targetUser);

            if (webSocketService != null) {
                ChallengeEventDto acceptedEvent = ChallengeEventDto.builder()
                        .type("CHALLENGE_ACCEPTED")
                        .challenger(match.getPlayer1().getUsername())
                        .targetUser(targetUser.getUsername())
                        .matchId(match.getId())
                        .inviteCode(match.getInviteCode())
                        .message(targetUser.getUsername() + " accepted your challenge!")
                        .timestamp(System.currentTimeMillis())
                        .build();

                webSocketService.sendChallengeResponse(match.getPlayer1().getUsername(), acceptedEvent);
            }

            return joined;
        } else {
            cancelMatch(match.getId(), match.getPlayer1());

            if (webSocketService != null) {
                ChallengeEventDto declinedEvent = ChallengeEventDto.builder()
                        .type("CHALLENGE_DECLINED")
                        .challenger(match.getPlayer1().getUsername())
                        .targetUser(targetUser.getUsername())
                        .matchId(match.getId())
                        .inviteCode(match.getInviteCode())
                        .message(targetUser.getUsername() + " declined your challenge.")
                        .timestamp(System.currentTimeMillis())
                        .build();

                webSocketService.sendChallengeResponse(match.getPlayer1().getUsername(), declinedEvent);
            }

            return toResponse(match);
        }
    }

    @Transactional(readOnly = true)
    public List<ChallengeEventDto> getPendingChallengesForUser(User user) {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(2);
        List<ArenaMatch> pending = arenaMatchRepository.findPendingChallengesForUser(user, cutoff);
        return pending.stream()
                .map(m -> ChallengeEventDto.builder()
                        .type("CHALLENGE_RECEIVED")
                        .challenger(m.getPlayer1().getUsername())
                        .challengerRating(m.getPlayer1().getRating())
                        .targetUser(user.getUsername())
                        .matchId(m.getId())
                        .inviteCode(m.getInviteCode())
                        .message(m.getPlayer1().getUsername() + " challenged you to a 1v1 Arena Duel!")
                        .timestamp(m.getCreatedAt().atZone(java.time.ZoneId.of("UTC")).toInstant().toEpochMilli())
                        .build())
                .toList();
    }

    private ArenaMatchResponse toResponse(
            ArenaMatch match) {

        boolean isTerminal = isCompletedStatus(match.getStatus()) || match.getStatus() == ArenaMatchStatus.CANCELLED;
        String solutionWord = isTerminal && match.getWord() != null ? match.getWord().getWord() : null;
        int remainingSeconds = calculateRemainingSeconds(match);

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
                match.getCompletedAt(),
                match.isPrivate(),
                match.getInviteCode(),
                match.isRematchRequestedByPlayer1(),
                match.isRematchRequestedByPlayer2(),
                match.getNextMatchId(),
                match.isLobbyClosed(),
                match.getPlayerLeft(),
                solutionWord,
                ARENA_MATCH_DURATION_SECONDS,
                remainingSeconds
        );
    }
}
