package com.wordlearena.game.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "words",
        indexes = {
                @Index(name = "idx_word_word", columnList = "word"),
                @Index(name = "idx_word_active", columnList = "active"),
                @Index(name = "idx_word_answer_eligible",
                        columnList = "answer_eligible")
        }
)
public class Word {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 5)
    private String word;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WordDifficulty difficulty;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private boolean answerEligible;

    public Word() {
    }

    public Long getId() {
        return id;
    }

    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public WordDifficulty getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(WordDifficulty difficulty) {
        this.difficulty = difficulty;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isAnswerEligible() {
        return answerEligible;
    }

    public void setAnswerEligible(boolean answerEligible) {
        this.answerEligible = answerEligible;
    }
}
