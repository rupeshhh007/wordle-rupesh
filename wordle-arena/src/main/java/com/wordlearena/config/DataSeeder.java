package com.wordlearena.config;

import com.wordlearena.game.entity.Word;
import com.wordlearena.game.entity.WordDifficulty;
import com.wordlearena.game.repository.WordRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner seedWords(
            WordRepository wordRepository) {

        return args -> {

            long existingWords = wordRepository.count();

            if (existingWords > 0) {
                syncAnswerEligibleWords(wordRepository, existingWords);
                return;
            }

            System.out.println("Starting word dictionary seed...");

            Set<String> answerWords = loadWords("answers.txt");

            List<Word> words = new ArrayList<>();

            try (
                    InputStream inputStream =
                            getClass()
                                    .getClassLoader()
                                    .getResourceAsStream("words.txt")
            ) {

                if (inputStream == null) {
                    throw new IllegalStateException(
                            "words.txt not found in src/main/resources"
                    );
                }

                try (
                        BufferedReader reader =
                                new BufferedReader(
                                        new InputStreamReader(
                                                inputStream,
                                                StandardCharsets.UTF_8
                                        )
                                )
                ) {

                    String line;

                    while ((line = reader.readLine()) != null) {

                        String word =
                                line.trim().toLowerCase();

                        if (word.isBlank()) {
                            continue;
                        }

                        if (!word.matches("[a-z]{5}")) {
                            continue;
                        }

                        /*
                         * Protect against duplicate lines
                         * in words.txt.
                         */
                        if (words.stream()
                                .anyMatch(existing ->
                                        existing.getWord()
                                                .equals(word))) {
                            continue;
                        }

                        Word entity = new Word();

                        entity.setWord(word);

                        entity.setDifficulty(
                                WordDifficulty.MEDIUM
                        );

                        entity.setActive(true);

                        /*
                         * Only words explicitly present
                         * in answers.txt can become
                         * Daily answers.
                         */
                        entity.setAnswerEligible(
                                answerWords.contains(word)
                        );

                        words.add(entity);
                    }
                }
            }

            wordRepository.saveAll(words);

            long answerCount =
                    words.stream()
                            .filter(Word::isAnswerEligible)
                            .count();

            System.out.println(
                    "Word dictionary seed complete."
            );

            System.out.println(
                    "Total words inserted: "
                            + words.size()
            );

            System.out.println(
                    "Daily answer words: "
                            + answerCount
            );
        };
    }

    private Set<String> loadWords(String filename) {

        Set<String> words = new HashSet<>();

        InputStream inputStream =
                getClass()
                        .getClassLoader()
                        .getResourceAsStream(filename);

        if (inputStream == null) {
            throw new IllegalStateException(
                    filename
                            + " not found in src/main/resources"
            );
        }

        try (
                BufferedReader reader =
                        new BufferedReader(
                                new InputStreamReader(
                                        inputStream,
                                        StandardCharsets.UTF_8
                                )
                        )
        ) {

            String line;

            while ((line = reader.readLine()) != null) {

                String word =
                        line.trim().toLowerCase();

                if (word.matches("[a-z]{5}")) {
                    words.add(word);
                }
            }

        } catch (Exception exception) {

            throw new IllegalStateException(
                    "Failed to load " + filename,
                    exception
            );
        }

        return words;
    }

    private void syncAnswerEligibleWords(WordRepository wordRepository, long existingWords) {

        Set<String> answerWords = loadWords("answers.txt");
        long currentAnswerCount = wordRepository.countByAnswerEligibleTrue();

        if (currentAnswerCount >= answerWords.size()) {
            System.out.println(
                    "Word dictionary already contains "
                            + existingWords
                            + " words and "
                            + currentAnswerCount
                            + " answer words. Skipping seed."
            );
            return;
        }

        System.out.println("Synchronizing " + answerWords.size() + " answer eligible words (current: " + currentAnswerCount + ")...");

        List<String> answerList = new ArrayList<>(answerWords);
        int batchSize = 500;
        int updatedTotal = 0;

        for (int i = 0; i < answerList.size(); i += batchSize) {
            List<String> batch = answerList.subList(i, Math.min(i + batchSize, answerList.size()));
            updatedTotal += wordRepository.markWordsAsAnswerEligible(batch);
        }

        long newAnswerCount = wordRepository.countByAnswerEligibleTrue();
        System.out.println(
                "Answer eligibility sync complete. Marked "
                        + updatedTotal
                        + " newly eligible words. Total answer words now: "
                        + newAnswerCount
        );
    }
}