package com.hebee.bookswap.dto;

import com.hebee.bookswap.constant.ReturnOtpStatus;
import java.time.LocalDateTime;

public class ReturnOtpGenerateResponseDTO {

    private Long exchangeRequestId;
    private ReturnOtpStatus status;
    private String otp;
    private LocalDateTime expiresAt;

    public ReturnOtpGenerateResponseDTO() {
    }

    public ReturnOtpGenerateResponseDTO(Long exchangeRequestId, ReturnOtpStatus status, String otp, LocalDateTime expiresAt) {
        this.exchangeRequestId = exchangeRequestId;
        this.status = status;
        this.otp = otp;
        this.expiresAt = expiresAt;
    }

    public Long getExchangeRequestId() {
        return exchangeRequestId;
    }

    public void setExchangeRequestId(Long exchangeRequestId) {
        this.exchangeRequestId = exchangeRequestId;
    }

    public ReturnOtpStatus getStatus() {
        return status;
    }

    public void setStatus(ReturnOtpStatus status) {
        this.status = status;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}
