package com.hebee.bookswap.service;

import com.hebee.bookswap.dto.BookPageResponse;
import com.hebee.bookswap.dto.BookRequest;
import com.hebee.bookswap.dto.BookResponse;

public interface BookService {
    BookResponse createBook(BookRequest request);
    BookResponse getBookById(Long id);
    BookPageResponse getAllBooks(int page, int size, String sortBy, String direction);
    BookResponse updateBook(Long id, BookRequest request);
    void deleteBook(Long id);
    BookPageResponse searchBooks(String keyword, String condition, int page, int size, String sortBy, String direction);
    BookPageResponse filterBooks(String condition, int page, int size, String sortBy, String direction);
    BookPageResponse getBooksByOwner(Long ownerId, int page, int size, String sortBy, String direction);
}
