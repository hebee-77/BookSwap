package com.hebee.bookswap.service;

import com.hebee.bookswap.dto.BookPageResponse;
import com.hebee.bookswap.dto.BookRequest;
import com.hebee.bookswap.dto.BookResponse;

import org.springframework.web.multipart.MultipartFile;

public interface BookService {
    BookResponse createBook(BookRequest request);
    BookResponse createBook(BookRequest request, MultipartFile image);
    BookResponse getBookById(Long id);
    BookPageResponse getAllBooks(int page, int size, String sortBy, String direction);
    BookResponse updateBook(Long id, BookRequest request);
    BookResponse updateBook(Long id, BookRequest request, MultipartFile image);
    void deleteBook(Long id);
    BookPageResponse searchBooks(String keyword, String condition, int page, int size, String sortBy, String direction);
    BookPageResponse filterBooks(String condition, int page, int size, String sortBy, String direction);
    BookPageResponse getBooksByOwner(Long ownerId, int page, int size, String sortBy, String direction);
}
