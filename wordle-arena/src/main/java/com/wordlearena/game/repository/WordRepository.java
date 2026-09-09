package com.wordlearena.game.repository;

import com.wordlearena.game.entity.Word;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface WordRepository extends JpaRepository<Word, Long> {

    Optional<Word> findByWord(String word);

    Optional<Word> findFirstByActiveTrue();

    boolean existsByWordAndActiveTrue(String word);

    List<Word> findAllByActiveTrue();

    long countByAnswerEligibleTrue();

    @Modifying
    @Transactional
    @Query("UPDATE Word w SET w.answerEligible = false WHERE w.answerEligible = true")
    int resetAllAnswerEligibility();

    @Modifying
    @Transactional
    @Query("UPDATE Word w SET w.answerEligible = true WHERE w.word IN :words AND w.answerEligible = false")
    int markWordsAsAnswerEligible(@Param("words") Collection<String> words);

    @Query(
            value = """
                    SELECT *
                    FROM words
                    WHERE active = true
                    ORDER BY RANDOM()
                    LIMIT 1
                    """,
            nativeQuery = true
    )
    Optional<Word> findRandomActiveWord();

    @Query(
            value = """
                    SELECT *
                    FROM words
                    WHERE active = true
                      AND answer_eligible = true
                    ORDER BY RANDOM()
                    LIMIT 1
                    """,
            nativeQuery = true
    )
    Optional<Word> findRandomAnswerEligibleWord();

    @Query(
            value = """
                    SELECT *
                    FROM words
                    WHERE active = true
                      AND answer_eligible = true
                    ORDER BY id
                    """,
            nativeQuery = true
    )
    List<Word> findAllAnswerEligibleWords();
}