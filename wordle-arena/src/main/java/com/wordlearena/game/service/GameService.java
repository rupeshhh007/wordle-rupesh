package com.wordlearena.game.service;

import com.wordlearena.game.dto.GameDetailsResponse;
import com.wordlearena.game.dto.GameResponse;
import com.wordlearena.game.dto.GuessResponse;
import com.wordlearena.game.entity.Game;
import com.wordlearena.game.entity.GameStatus;
import com.wordlearena.game.entity.GameType;
import com.wordlearena.game.entity.Guess;
import com.wordlearena.game.entity.Word;
import com.wordlearena.game.exception.GameAlreadyFinishedException;
import com.wordlearena.game.exception.GameNotFoundException;
import com.wordlearena.game.exception.InvalidGuessException;
import com.wordlearena.game.logic.LetterResult;
import com.wordlearena.game.repository.GameRepository;
import com.wordlearena.game.repository.GuessRepository;
import com.wordlearena.game.repository.WordRepository;
import com.wordlearena.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class GameService {

    private final GameRepository gameRepository;
    private final WordRepository wordRepository;
    private final GuessRepository guessRepository;
    private final WordEvaluationService wordEvaluationService;

    public GameService(
            GameRepository gameRepository,
            WordRepository wordRepository,
            GuessRepository guessRepository,
            WordEvaluationService wordEvaluationService) {

        this.gameRepository = gameRepository;
        this.wordRepository = wordRepository;
        this.guessRepository = guessRepository;
        this.wordEvaluationService = wordEvaluationService;
    }

    @Transactional
    public Game startGame(User user, GameType gameType) {

        Word word = wordRepository.findRandomAnswerEligibleWord()
                .or(wordRepository::findRandomActiveWord)
                .orElseThrow(() -> new IllegalStateException("No active words available"));
        Game game = new Game();

        game.setUser(user);
        game.setWord(word);
        game.setGameType(gameType);
        game.setStatus(GameStatus.IN_PROGRESS);
        game.setAttemptCount(0);
        game.setStartedAt(LocalDateTime.now());

        return gameRepository.save(game);
    }

    @Transactional
    public GuessResponse submitGuess(
            Long gameId,
            String rawGuess,
            User user){

        // 1. Find the game
        Game game = gameRepository
                .findByIdAndUser(gameId, user)
                .orElseThrow(() ->
                        new GameNotFoundException(
                                "Game with id " + gameId + " does not exist"
                        )
                );

        // 2. Make sure the game is still running
        if (game.getStatus() != GameStatus.IN_PROGRESS) {
            throw new GameAlreadyFinishedException(
                    "Game with id " + gameId + " is already finished"
            );
        }

        // 3. Maximum of 6 attempts
        if (game.getAttemptCount() >= 6) {
            throw new IllegalStateException(
                    "Maximum attempts reached"
            );
        }

        // 4. Normalize the guess
        String guess = rawGuess
                .trim()
                .toLowerCase();

        // 5. Validate the guess format
        if (!guess.matches("[a-z]{5}")) {
            throw new InvalidGuessException(
                    "Guess must contain exactly 5 letters"
            );
        }

        // 6. Make sure the word exists in our dictionary
        boolean validWord =
                wordRepository.existsByWordAndActiveTrue(guess);

        if (!validWord) {
            throw new InvalidGuessException(
                    "Word is not in dictionary"
            );
        }

        // 7. Determine attempt number
        int attemptNumber =
                game.getAttemptCount() + 1;

        // 8. Evaluate the guess
        LetterResult[] result =
                wordEvaluationService.evaluate(
                        game.getWord().getWord(),
                        guess
                );

        // 9. Create Guess entity
        Guess guessEntity = new Guess();

        guessEntity.setGame(game);
        guessEntity.setGuess(guess);
        guessEntity.setAttemptNumber(attemptNumber);
        guessEntity.setResult(resultToString(result));
        guessEntity.setCreatedAt(LocalDateTime.now());

        // 10. Save the guess
        guessRepository.save(guessEntity);

        // 11. Update attempt count
        game.setAttemptCount(attemptNumber);

        // 12. Check whether the player won
        boolean won = true;

        for (LetterResult letterResult : result) {

            if (letterResult != LetterResult.CORRECT) {
                won = false;
                break;
            }
        }

        // 13. Update game status
        if (won) {

            game.setStatus(GameStatus.WON);
            game.setCompletedAt(LocalDateTime.now());

        } else if (attemptNumber == 6) {

            game.setStatus(GameStatus.LOST);
            game.setCompletedAt(LocalDateTime.now());
        }

        // 14. Save updated game
        gameRepository.save(game);

        // 15. Return response
        return new GuessResponse(
                guess,
                result,
                attemptNumber,
                game.getStatus()
        );
    }

    /**
     * Converts:
     *
     * [CORRECT, PRESENT, ABSENT, ABSENT, CORRECT]
     *
     * into:
     *
     * CORRECT,PRESENT,ABSENT,ABSENT,CORRECT
     */
    private String resultToString(LetterResult[] result) {

        StringBuilder builder =
                new StringBuilder();

        for (LetterResult letterResult : result) {

            if (builder.length() > 0) {
                builder.append(",");
            }

            builder.append(letterResult.name());
        }

        return builder.toString();
    }
    @Transactional(readOnly = true)
    public GameDetailsResponse getGame(Long gameId, User user) {

        Game game = gameRepository
                .findByIdAndUser(gameId, user)
                .orElseThrow(() ->
                        new GameNotFoundException(
                                "Game with id " + gameId + " does not exist"
                        )
                );

        var guesses = guessRepository
                .findByGameOrderByAttemptNumberAsc(game);

        var guessResponses = guesses.stream()
                .map(guess -> {

                    LetterResult[] results =
                            parseResult(guess.getResult());

                    return new GuessResponse(
                            guess.getGuess(),
                            results,
                            guess.getAttemptNumber(),
                            game.getStatus()
                    );
                })
                .toList();

        return new GameDetailsResponse(
                game.getId(),
                game.getGameType(),
                game.getStatus(),
                game.getAttemptCount(),
                game.getStartedAt(),
                game.getCompletedAt(),
                guessResponses
        );
    }
    private LetterResult[] parseResult(String result) {

        String[] values = result.split(",");

        LetterResult[] results =
                new LetterResult[values.length];

        for (int i = 0; i < values.length; i++) {
            results[i] =
                    LetterResult.valueOf(values[i]);
        }

        return results;
    }
    @Transactional(readOnly = true)
    public List<GameResponse> getUserGames(User user) {

        return gameRepository
                .findByUserOrderByStartedAtDesc(user)
                .stream()
                .map(game -> new GameResponse(
                        game.getId(),
                        game.getGameType(),
                        game.getStatus(),
                        game.getAttemptCount(),
                        game.getStartedAt()
                ))
                .toList();
    }
    @Transactional
    public GameResponse abandonGame(
            Long gameId,
            User user) {

        Game game = gameRepository
                .findByIdAndUser(gameId, user)
                .orElseThrow(() ->
                        new GameNotFoundException(
                                "Game with id " + gameId +
                                        " does not exist"
                        )
                );

        if (game.getStatus() != GameStatus.IN_PROGRESS) {

            throw new GameAlreadyFinishedException(
                    "Game with id " + gameId +
                            " is already finished"
            );
        }

        game.setStatus(GameStatus.ABANDONED);
        game.setCompletedAt(LocalDateTime.now());

        gameRepository.save(game);

        return new GameResponse(
                game.getId(),
                game.getGameType(),
                game.getStatus(),
                game.getAttemptCount(),
                game.getStartedAt()
        );
    }
}