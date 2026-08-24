package com.hebee.bookswap.dto;

import com.hebee.bookswap.constant.ExchangeEventType;
import java.time.LocalDateTime;

public class ExchangeHistoryResponseDTO {

    private Long id;
    private Long exchangeRequestId;
    private Long actorId;
    private String actorName;
    private String actorEmail;
    private ExchangeEventType eventType;
    private LocalDateTime createdAt;
    private String note;

    public ExchangeHistoryResponseDTO() {
    }

    public ExchangeHistoryResponseDTO(Long id, Long exchangeRequestId, Long actorId, String actorName, String actorEmail, ExchangeEventType eventType, LocalDateTime createdAt, String note) {
        this.id = id;
        this.exchangeRequestId = exchangeRequestId;
        this.actorId = actorId;
        this.actorName = actorName;
        this.actorEmail = actorEmail;
        this.eventType = eventType;
        this.createdAt = createdAt;
        this.note = note;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getExchangeRequestId() {
        return exchangeRequestId;
    }

    public void setExchangeRequestId(Long exchangeRequestId) {
        this.exchangeRequestId = exchangeRequestId;
    }

    public Long getActorId() {
        return actorId;
    }

    public void setActorId(Long actorId) {
        this.actorId = actorId;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public void setActorEmail(String actorEmail) {
        this.actorEmail = actorEmail;
    }

    public ExchangeEventType getEventType() {
        return eventType;
    }

    public void setEventType(ExchangeEventType eventType) {
        this.eventType = eventType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
