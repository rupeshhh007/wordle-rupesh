package com.wordlearena.game.entity;

import jakarta.persistence.*;
import lombok.Setter;

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

    @Setter
    @Column(nullable = false, unique = true, length = 5)
    private String word;

    @Setter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WordDifficulty difficulty;

    @Setter
    @Column(nullable = false)
    private boolean active;

    @Setter
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

    public WordDifficulty getDifficulty() {
        return difficulty;
    }

    public boolean isActive() {
        return active;
    }

    public boolean isAnswerEligible() {
        return answerEligible;
    }
}
