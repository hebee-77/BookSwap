package com.hebee.bookswap.dto.chat;

import com.hebee.bookswap.constant.BookCondition;
import com.hebee.bookswap.constant.ExchangeRequestStatus;

public class ExchangeSummaryDTO {
    private Long id;
    private ExchangeRequestStatus status;
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String bookImageUrl;
    private BookCondition bookCondition;
    private Long offeredBookId;
    private String offeredBookTitle;
    private String offeredBookAuthor;
    private String offeredBookImageUrl;
    private BookCondition offeredBookCondition;
    private Long requesterId;
    private String requesterName;
    private Long ownerId;
    private String ownerName;

    public ExchangeSummaryDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ExchangeRequestStatus getStatus() {
        return status;
    }

    public void setStatus(ExchangeRequestStatus status) {
        this.status = status;
    }

    public Long getBookId() {
        return bookId;
    }

    public void setBookId(Long bookId) {
        this.bookId = bookId;
    }

    public String getBookTitle() {
        return bookTitle;
    }

    public void setBookTitle(String bookTitle) {
        this.bookTitle = bookTitle;
    }

    public String getBookAuthor() {
        return bookAuthor;
    }

    public void setBookAuthor(String bookAuthor) {
        this.bookAuthor = bookAuthor;
    }

    public String getBookImageUrl() {
        return bookImageUrl;
    }

    public void setBookImageUrl(String bookImageUrl) {
        this.bookImageUrl = bookImageUrl;
    }

    public BookCondition getBookCondition() {
        return bookCondition;
    }

    public void setBookCondition(BookCondition bookCondition) {
        this.bookCondition = bookCondition;
    }

    public Long getOfferedBookId() {
        return offeredBookId;
    }

    public void setOfferedBookId(Long offeredBookId) {
        this.offeredBookId = offeredBookId;
    }

    public String getOfferedBookTitle() {
        return offeredBookTitle;
    }

    public void setOfferedBookTitle(String offeredBookTitle) {
        this.offeredBookTitle = offeredBookTitle;
    }

    public String getOfferedBookAuthor() {
        return offeredBookAuthor;
    }

    public void setOfferedBookAuthor(String offeredBookAuthor) {
        this.offeredBookAuthor = offeredBookAuthor;
    }

    public String getOfferedBookImageUrl() {
        return offeredBookImageUrl;
    }

    public void setOfferedBookImageUrl(String offeredBookImageUrl) {
        this.offeredBookImageUrl = offeredBookImageUrl;
    }

    public BookCondition getOfferedBookCondition() {
        return offeredBookCondition;
    }

    public void setOfferedBookCondition(BookCondition offeredBookCondition) {
        this.offeredBookCondition = offeredBookCondition;
    }

    public Long getRequesterId() {
        return requesterId;
    }

    public void setRequesterId(Long requesterId) {
        this.requesterId = requesterId;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public void setRequesterName(String requesterName) {
        this.requesterName = requesterName;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }
}
