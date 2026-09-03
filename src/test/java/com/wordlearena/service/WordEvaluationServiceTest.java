package com.wordlearena.game.service;

import com.wordlearena.game.logic.LetterResult;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class WordEvaluationServiceTest {

    private final WordEvaluationService service =
            new WordEvaluationService();

    @Test
    void allLettersCorrect() {

        LetterResult[] result =
                service.evaluate("crane", "crane");

        assertArrayEquals(
                new LetterResult[]{
                        LetterResult.CORRECT,
                        LetterResult.CORRECT,
                        LetterResult.CORRECT,
                        LetterResult.CORRECT,
                        LetterResult.CORRECT
                },
                result
        );
    }
}