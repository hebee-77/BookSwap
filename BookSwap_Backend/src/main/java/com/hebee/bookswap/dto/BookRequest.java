package com.hebee.bookswap.dto;

import com.hebee.bookswap.constant.BookCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class BookRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Author is required")
    private String author;

    private String isbn;
    private String description;

    @NotNull(message = "Book condition is required")
    private BookCondition bookCondition;

    public BookRequest() {
    }

    public BookRequest(String title, String author, String isbn, String description, BookCondition bookCondition) {
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.description = description;
        this.bookCondition = bookCondition;
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
}
