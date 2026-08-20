package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.service.FileStorageService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class LocalFileStorageService implements FileStorageService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
    );

    @Value("${app.file.upload-dir:uploads/books}")
    private String uploadDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory: " + uploadDir, e);
        }
    }

    // Constructor for testing or injection
    public LocalFileStorageService() {
    }

    public LocalFileStorageService(String uploadDir) {
        this.uploadDir = uploadDir;
        init();
    }

    @Override
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store an empty or null file");
        }

        // 1. Validate File Size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of 5 MB");
        }

        // 2. Validate MIME type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported file type: " + contentType + ". Only JPEG, PNG, and WebP images are allowed.");
        }

        // 3. Extract and Validate File Extension
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (StringUtils.hasText(originalFilename)) {
            String cleanOriginal = StringUtils.cleanPath(originalFilename);
            int dotIndex = cleanOriginal.lastIndexOf('.');
            if (dotIndex >= 0) {
                extension = cleanOriginal.substring(dotIndex).toLowerCase();
            }
        }

        // Fallback extension from contentType if missing or mismatch
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            if ("image/jpeg".equalsIgnoreCase(contentType)) {
                extension = ".jpg";
            } else if ("image/png".equalsIgnoreCase(contentType)) {
                extension = ".png";
            } else if ("image/webp".equalsIgnoreCase(contentType)) {
                extension = ".webp";
            } else {
                throw new IllegalArgumentException("Invalid file extension. Allowed extensions are: .jpg, .jpeg, .png, .webp");
            }
        }

        // 4. Generate Safe Server-Side Unique Filename
        String uniqueFilename = UUID.randomUUID().toString() + "-" + System.currentTimeMillis() + extension;

        try {
            if (this.rootLocation == null) {
                init();
            }

            Path destinationFile = this.rootLocation.resolve(uniqueFilename).normalize().toAbsolutePath();

            // Prevent path traversal attack
            if (!destinationFile.getParent().equals(this.rootLocation)) {
                throw new IllegalArgumentException("Cannot store file outside current directory");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }

            return "/uploads/books/" + uniqueFilename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            return;
        }

        try {
            if (this.rootLocation == null) {
                init();
            }

            // Extract filename from URL (e.g. /uploads/books/filename.jpg -> filename.jpg)
            String filename = imageUrl;
            int lastSlash = imageUrl.lastIndexOf('/');
            if (lastSlash >= 0) {
                filename = imageUrl.substring(lastSlash + 1);
            }

            // Sanitize filename
            filename = Paths.get(filename).getFileName().toString();

            Path fileToDelete = this.rootLocation.resolve(filename).normalize().toAbsolutePath();

            // Verify path traversal prevention
            if (fileToDelete.getParent().equals(this.rootLocation)) {
                Files.deleteIfExists(fileToDelete);
            }
        } catch (Exception e) {
            // Log and handle safely: do not fail book deletion if image file is missing or unreadable
            System.err.println("Could not delete image file for imageUrl: " + imageUrl + ". Reason: " + e.getMessage());
        }
    }
}
