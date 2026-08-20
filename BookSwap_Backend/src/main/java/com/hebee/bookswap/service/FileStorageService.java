package com.hebee.bookswap.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    /**
     * Validates and stores the uploaded multipart image file.
     *
     * @param file the uploaded file
     * @return the relative URL/path to access the stored image (e.g., "/uploads/books/uuid.jpg")
     */
    String storeFile(MultipartFile file);

    /**
     * Deletes the stored image file from the filesystem.
     *
     * @param imageUrl the stored image URL or path
     */
    void deleteFile(String imageUrl);
}
