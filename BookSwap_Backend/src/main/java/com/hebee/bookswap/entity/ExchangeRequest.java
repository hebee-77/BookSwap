package com.hebee.bookswap.entity;

import com.hebee.bookswap.constant.ExchangeRequestStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exchange_requests")
public class ExchangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50, columnDefinition = "VARCHAR(50)")
    private ExchangeRequestStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ExchangeRequest() {
    }

    public ExchangeRequest(User requester, Book book, ExchangeRequestStatus status) {
        this.requester = requester;
        this.book = book;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getRequester() {
        return requester;
    }

    public void setRequester(User requester) {
        this.requester = requester;
    }

    public Book getBook() {
        return book;
    }

    public void setBook(Book book) {
        this.book = book;
    }

    public ExchangeRequestStatus getStatus() {
        return status;
    }

    public void setStatus(ExchangeRequestStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
