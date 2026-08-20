package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.constant.BookCondition;
import com.hebee.bookswap.constant.ExchangeRequestStatus;
import com.hebee.bookswap.dto.BookRequest;
import com.hebee.bookswap.dto.BookResponse;
import com.hebee.bookswap.entity.Book;
import com.hebee.bookswap.entity.Role;
import com.hebee.bookswap.entity.User;
import com.hebee.bookswap.mapper.BookMapper;
import com.hebee.bookswap.repository.BookRepository;
import com.hebee.bookswap.repository.ExchangeRequestRepository;
import com.hebee.bookswap.repository.UserRepository;
import com.hebee.bookswap.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class BookServiceImplTest {

    @Mock
    private BookRepository bookRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExchangeRequestRepository exchangeRequestRepository;

    @Mock
    private FileStorageService fileStorageService;

    private BookServiceImpl bookService;

    private User owner;

    @BeforeEach
    void setUp() {
        bookService = new BookServiceImpl(
                bookRepository,
                userRepository,
                exchangeRequestRepository,
                new BookMapper(),
                fileStorageService
        );

        owner = new User("John Doe", "john@example.com", "password");
        owner.setId(1L);
        Role userRole = new Role("USER");
        owner.setRoles(Set.of(userRole));

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("john@example.com", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testCreateBook_WithoutImage() {
        BookRequest request = new BookRequest("Clean Code", "Robert Martin", "12345", "Desc", BookCondition.GOOD);

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(owner));
        when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> {
            Book b = invocation.getArgument(0);
            b.setId(10L);
            return b;
        });

        BookResponse response = bookService.createBook(request, null);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Clean Code", response.getTitle());
        assertNull(response.getImageUrl());
        assertTrue(response.isAvailable());

        verify(fileStorageService, never()).storeFile(any());
    }

    @Test
    void testCreateBook_WithValidImage() {
        BookRequest request = new BookRequest("Clean Code", "Robert Martin", "12345", "Desc", BookCondition.GOOD);
        MockMultipartFile image = new MockMultipartFile(
                "image",
                "cover.jpg",
                "image/jpeg",
                "image data".getBytes()
        );

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(owner));
        when(fileStorageService.storeFile(image)).thenReturn("/uploads/books/uuid-cover.jpg");
        when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> {
            Book b = invocation.getArgument(0);
            b.setId(10L);
            return b;
        });

        BookResponse response = bookService.createBook(request, image);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("/uploads/books/uuid-cover.jpg", response.getImageUrl());
        verify(fileStorageService, times(1)).storeFile(image);
    }

    @Test
    void testUpdateBook_WithoutChangingImage() {
        Book existingBook = new Book("Old Title", "Author", "123", "Desc", BookCondition.GOOD, owner);
        existingBook.setId(10L);
        existingBook.setImageUrl("/uploads/books/existing-cover.jpg");

        BookRequest updateRequest = new BookRequest("New Title", "Author", "123", "Desc", BookCondition.GOOD);

        when(bookRepository.findById(10L)).thenReturn(Optional.of(existingBook));
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(owner));
        when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookResponse response = bookService.updateBook(10L, updateRequest, null);

        assertEquals("New Title", response.getTitle());
        assertEquals("/uploads/books/existing-cover.jpg", response.getImageUrl());
        verify(fileStorageService, never()).storeFile(any());
        verify(fileStorageService, never()).deleteFile(any());
    }

    @Test
    void testUpdateBook_WithNewImage() {
        Book existingBook = new Book("Old Title", "Author", "123", "Desc", BookCondition.GOOD, owner);
        existingBook.setId(10L);
        existingBook.setImageUrl("/uploads/books/old-cover.jpg");

        BookRequest updateRequest = new BookRequest("New Title", "Author", "123", "Desc", BookCondition.GOOD);
        MockMultipartFile newImage = new MockMultipartFile(
                "image",
                "new.png",
                "image/png",
                "new image data".getBytes()
        );

        when(bookRepository.findById(10L)).thenReturn(Optional.of(existingBook));
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(owner));
        when(fileStorageService.storeFile(newImage)).thenReturn("/uploads/books/new-uuid.png");
        when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookResponse response = bookService.updateBook(10L, updateRequest, newImage);

        assertEquals("/uploads/books/new-uuid.png", response.getImageUrl());
        verify(fileStorageService, times(1)).storeFile(newImage);
        verify(fileStorageService, times(1)).deleteFile("/uploads/books/old-cover.jpg");
    }

    @Test
    void testDeleteBook_WithImage() {
        Book book = new Book("Title", "Author", "123", "Desc", BookCondition.GOOD, owner);
        book.setId(10L);
        book.setImageUrl("/uploads/books/book-cover.jpg");

        when(bookRepository.findById(10L)).thenReturn(Optional.of(book));
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(owner));
        when(exchangeRequestRepository.existsByBookIdAndStatus(10L, ExchangeRequestStatus.ACCEPTED)).thenReturn(false);
        when(exchangeRequestRepository.findByBookId(10L)).thenReturn(Collections.emptyList());

        bookService.deleteBook(10L);

        verify(bookRepository, times(1)).delete(book);
        verify(fileStorageService, times(1)).deleteFile("/uploads/books/book-cover.jpg");
    }
}
