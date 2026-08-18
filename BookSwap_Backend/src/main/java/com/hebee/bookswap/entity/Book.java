package com.hebee.bookswap.entity;

import com.hebee.bookswap.constant.BookCondition;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "books")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 150)
    private String author;

    @Column(length = 20)
    private String isbn;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "book_condition", nullable = false, length = 50, columnDefinition = "VARCHAR(50)")
    private BookCondition bookCondition;

    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "book")
    private List<ExchangeRequest> exchangeRequests = new ArrayList<>();

    public Book() {
    }

    public Book(String title, String author, String isbn, String description, BookCondition bookCondition, User owner) {
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.description = description;
        this.bookCondition = bookCondition;
        this.owner = owner;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getIsbn() {
        return isbn;
    }

    public void setIsbn(String isbn) {
        this.isbn = isbn;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BookCondition getBookCondition() {
        return bookCondition;
    }

    public void setBookCondition(BookCondition bookCondition) {
        this.bookCondition = bookCondition;
    }

    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<ExchangeRequest> getExchangeRequests() {
        return exchangeRequests;
    }

    public void setExchangeRequests(List<ExchangeRequest> exchangeRequests) {
        this.exchangeRequests = exchangeRequests;
    }
}
