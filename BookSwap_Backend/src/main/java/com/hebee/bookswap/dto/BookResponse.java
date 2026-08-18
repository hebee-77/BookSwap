package com.hebee.bookswap.dto;

import com.hebee.bookswap.constant.BookCondition;
import java.time.LocalDateTime;

public class BookResponse {

    private Long id;
    private String title;
    private String author;
    private String isbn;
    private String description;
    private BookCondition bookCondition;
    private Long ownerId;
    private LocalDateTime createdAt;
    private boolean available;

    public BookResponse() {
    }

    public BookResponse(Long id, String title, String author, String isbn, String description, BookCondition bookCondition, Long ownerId, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.description = description;
        this.bookCondition = bookCondition;
        this.ownerId = ownerId;
        this.createdAt = createdAt;
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

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }
}
