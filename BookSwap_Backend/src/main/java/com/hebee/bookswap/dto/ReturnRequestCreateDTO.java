package com.hebee.bookswap.dto;

public class ReturnRequestCreateDTO {

    private String message;

    public ReturnRequestCreateDTO() {
    }

    public ReturnRequestCreateDTO(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
