package com.wordlearena.game.service;

import com.wordlearena.game.logic.LetterResult;
import org.springframework.stereotype.Service;

@Service
public class WordEvaluationService {

    public LetterResult[] evaluate(String answer, String guess) {

        answer = answer.toLowerCase();
        guess = guess.toLowerCase();

        LetterResult[] result = new LetterResult[5];

        int[] frequency = new int[26];

        // PASS 1: exact matches
        for (int i = 0; i < 5; i++) {

            if (guess.charAt(i) == answer.charAt(i)) {

                result[i] = LetterResult.CORRECT;

            } else {

                frequency[answer.charAt(i) - 'a']++;
            }
        }

        // PASS 2: present / absent
        for (int i = 0; i < 5; i++) {

            if (result[i] == LetterResult.CORRECT) {
                continue;
            }

            int index = guess.charAt(i) - 'a';

            if (frequency[index] > 0) {

                result[i] = LetterResult.PRESENT;
                frequency[index]--;

            } else {

                result[i] = LetterResult.ABSENT;
            }
        }

        return result;
    }
}