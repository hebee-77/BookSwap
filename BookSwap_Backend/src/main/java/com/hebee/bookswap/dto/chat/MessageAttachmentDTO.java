package com.hebee.bookswap.dto.chat;

import java.time.LocalDateTime;

public class MessageAttachmentDTO {
    private Long id;
    private String fileUrl;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private LocalDateTime createdAt;

    public MessageAttachmentDTO() {
    }

    public MessageAttachmentDTO(Long id, String fileUrl, String fileName, String fileType, Long fileSize, LocalDateTime createdAt) {
        this.id = id;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
