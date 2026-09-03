package com.wordlearena.game.entity;

import jakarta.persistence.*;
import lombok.Setter;

@Entity
@Table(name = "words")
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
    private boolean active = true;

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

}