package com.hebee.bookswap.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

public class LocalFileStorageServiceTest {

    @TempDir
    Path tempDir;

    private LocalFileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        fileStorageService = new LocalFileStorageService(tempDir.toString());
    }

    @Test
    void testStoreFile_ValidJpg() {
        MockMultipartFile file = new MockMultipartFile(
                "image",
                "cover.jpg",
                "image/jpeg",
                "test jpeg image content".getBytes()
        );

        String result = fileStorageService.storeFile(file);

        assertNotNull(result);
        assertTrue(result.startsWith("/uploads/books/"));
        assertTrue(result.endsWith(".jpg"));

        String filename = result.substring("/uploads/books/".length());
        assertTrue(Files.exists(tempDir.resolve(filename)));
    }

    @Test
    void testStoreFile_ValidPng() {
        MockMultipartFile file = new MockMultipartFile(
                "image",
                "cover.png",
                "image/png",
                "test png image content".getBytes()
        );

        String result = fileStorageService.storeFile(file);

        assertNotNull(result);
        assertTrue(result.startsWith("/uploads/books/"));
        assertTrue(result.endsWith(".png"));

        String filename = result.substring("/uploads/books/".length());
        assertTrue(Files.exists(tempDir.resolve(filename)));
    }

    @Test
    void testStoreFile_ValidWebp() {
        MockMultipartFile file = new MockMultipartFile(
                "image",
                "cover.webp",
                "image/webp",
                "test webp image content".getBytes()
        );

        String result = fileStorageService.storeFile(file);

        assertNotNull(result);
        assertTrue(result.startsWith("/uploads/books/"));
        assertTrue(result.endsWith(".webp"));

        String filename = result.substring("/uploads/books/".length());
        assertTrue(Files.exists(tempDir.resolve(filename)));
    }

    @Test
    void testStoreFile_NullOrEmpty() {
        assertThrows(IllegalArgumentException.class, () -> fileStorageService.storeFile(null));

        MockMultipartFile emptyFile = new MockMultipartFile(
                "image",
                "empty.jpg",
                "image/jpeg",
                new byte[0]
        );
        assertThrows(IllegalArgumentException.class, () -> fileStorageService.storeFile(emptyFile));
    }

    @Test
    void testStoreFile_UnsupportedMimeType() {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file",
                "document.pdf",
                "application/pdf",
                "pdf content".getBytes()
        );
        assertThrows(IllegalArgumentException.class, () -> fileStorageService.storeFile(pdfFile));

        MockMultipartFile svgFile = new MockMultipartFile(
                "file",
                "image.svg",
                "image/svg+xml",
                "<svg></svg>".getBytes()
        );
        assertThrows(IllegalArgumentException.class, () -> fileStorageService.storeFile(svgFile));
    }

    @Test
    void testStoreFile_OversizedFile() {
        byte[] largeBytes = new byte[6 * 1024 * 1024]; // 6 MB
        MockMultipartFile largeFile = new MockMultipartFile(
                "image",
                "large.jpg",
                "image/jpeg",
                largeBytes
        );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> fileStorageService.storeFile(largeFile)
        );
        assertTrue(ex.getMessage().contains("exceeds"));
    }

    @Test
    void testDeleteFile_ExistingFile() {
        MockMultipartFile file = new MockMultipartFile(
                "image",
                "test.jpg",
                "image/jpeg",
                "content".getBytes()
        );
        String imageUrl = fileStorageService.storeFile(file);
        String filename = imageUrl.substring("/uploads/books/".length());

        assertTrue(Files.exists(tempDir.resolve(filename)));

        fileStorageService.deleteFile(imageUrl);
        assertFalse(Files.exists(tempDir.resolve(filename)));
    }

    @Test
    void testDeleteFile_SafeWithNonExistingOrNull() {
        assertDoesNotThrow(() -> fileStorageService.deleteFile(null));
        assertDoesNotThrow(() -> fileStorageService.deleteFile(""));
        assertDoesNotThrow(() -> fileStorageService.deleteFile("/uploads/books/non_existent.jpg"));
    }
}
