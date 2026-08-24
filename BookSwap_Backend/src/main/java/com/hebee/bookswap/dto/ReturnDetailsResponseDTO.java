package com.hebee.bookswap.dto;

import com.hebee.bookswap.constant.ExchangeRequestStatus;
import java.time.LocalDateTime;
import java.util.List;

public class ReturnDetailsResponseDTO {

    private Long exchangeId;
    private ExchangeRequestStatus status;
    
    // Book details
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String bookImageUrl;
    
    // Offered book details (if any)
    private Long offeredBookId;
    private String offeredBookTitle;
    private String offeredBookAuthor;
    private String offeredBookImageUrl;

    // Participants
    private Long ownerId;
    private String ownerName;
    private Long requesterId;
    private String requesterName;
    private Long currentHolderId;
    private String currentHolderName;

    // Timestamps
    private LocalDateTime exchangeCreatedAt;
    private LocalDateTime returnRequestedAt;
    private LocalDateTime returnAcceptedAt;
    private LocalDateTime returnDeclinedAt;
    private LocalDateTime returnStartedAt;
    private LocalDateTime returnedAt;
    private LocalDateTime confirmedAt;
    private String returnMessage;

    // Allowed actions for the calling user
    private boolean canRequestReturn;
    private boolean canAcceptReturn;
    private boolean canDeclineReturn;
    private boolean canMarkReturned;
    private boolean canConfirmReceived;

    // Audit history list
    private List<ExchangeHistoryResponseDTO> history;

    public ReturnDetailsResponseDTO() {
    }

    public Long getExchangeId() {
        return exchangeId;
    }

    public void setExchangeId(Long exchangeId) {
        this.exchangeId = exchangeId;
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

    public Long getCurrentHolderId() {
        return currentHolderId;
    }

    public void setCurrentHolderId(Long currentHolderId) {
        this.currentHolderId = currentHolderId;
    }

    public String getCurrentHolderName() {
        return currentHolderName;
    }

    public void setCurrentHolderName(String currentHolderName) {
        this.currentHolderName = currentHolderName;
    }

    public LocalDateTime getExchangeCreatedAt() {
        return exchangeCreatedAt;
    }

    public void setExchangeCreatedAt(LocalDateTime exchangeCreatedAt) {
        this.exchangeCreatedAt = exchangeCreatedAt;
    }

    public LocalDateTime getReturnRequestedAt() {
        return returnRequestedAt;
    }

    public void setReturnRequestedAt(LocalDateTime returnRequestedAt) {
        this.returnRequestedAt = returnRequestedAt;
    }

    public LocalDateTime getReturnAcceptedAt() {
        return returnAcceptedAt;
    }

    public void setReturnAcceptedAt(LocalDateTime returnAcceptedAt) {
        this.returnAcceptedAt = returnAcceptedAt;
    }

    public LocalDateTime getReturnDeclinedAt() {
        return returnDeclinedAt;
    }

    public void setReturnDeclinedAt(LocalDateTime returnDeclinedAt) {
        this.returnDeclinedAt = returnDeclinedAt;
    }

    public LocalDateTime getReturnStartedAt() {
        return returnStartedAt;
    }

    public void setReturnStartedAt(LocalDateTime returnStartedAt) {
        this.returnStartedAt = returnStartedAt;
    }

    public LocalDateTime getReturnedAt() {
        return returnedAt;
    }

    public void setReturnedAt(LocalDateTime returnedAt) {
        this.returnedAt = returnedAt;
    }

    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(LocalDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public String getReturnMessage() {
        return returnMessage;
    }

    public void setReturnMessage(String returnMessage) {
        this.returnMessage = returnMessage;
    }

    public boolean isCanRequestReturn() {
        return canRequestReturn;
    }

    public void setCanRequestReturn(boolean canRequestReturn) {
        this.canRequestReturn = canRequestReturn;
    }

    public boolean isCanAcceptReturn() {
        return canAcceptReturn;
    }

    public void setCanAcceptReturn(boolean canAcceptReturn) {
        this.canAcceptReturn = canAcceptReturn;
    }

    public boolean isCanDeclineReturn() {
        return canDeclineReturn;
    }

    public void setCanDeclineReturn(boolean canDeclineReturn) {
        this.canDeclineReturn = canDeclineReturn;
    }

    public boolean isCanMarkReturned() {
        return canMarkReturned;
    }

    public void setCanMarkReturned(boolean canMarkReturned) {
        this.canMarkReturned = canMarkReturned;
    }

    public boolean isCanConfirmReceived() {
        return canConfirmReceived;
    }

    public void setCanConfirmReceived(boolean canConfirmReceived) {
        this.canConfirmReceived = canConfirmReceived;
    }

    public List<ExchangeHistoryResponseDTO> getHistory() {
        return history;
    }

    public void setHistory(List<ExchangeHistoryResponseDTO> history) {
        this.history = history;
    }
}
