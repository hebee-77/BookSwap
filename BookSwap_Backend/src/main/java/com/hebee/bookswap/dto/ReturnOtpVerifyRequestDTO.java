package com.hebee.bookswap.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ReturnOtpVerifyRequestDTO {

    @NotBlank(message = "OTP cannot be blank")
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP must be exactly 6 digits")
    private String otp;

    public ReturnOtpVerifyRequestDTO() {
    }

    public ReturnOtpVerifyRequestDTO(String otp) {
        this.otp = otp;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}
