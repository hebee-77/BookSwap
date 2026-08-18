package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.constant.BookCondition;
import com.hebee.bookswap.constant.ExchangeRequestStatus;
import com.hebee.bookswap.dto.BookPageResponse;
import com.hebee.bookswap.dto.BookRequest;
import com.hebee.bookswap.dto.BookResponse;
import com.hebee.bookswap.entity.Book;
import com.hebee.bookswap.entity.ExchangeRequest;
import com.hebee.bookswap.entity.User;
import com.hebee.bookswap.exception.ResourceNotFoundException;
import com.hebee.bookswap.mapper.BookMapper;
import com.hebee.bookswap.repository.BookRepository;
import com.hebee.bookswap.repository.ExchangeRequestRepository;
import com.hebee.bookswap.repository.UserRepository;
import com.hebee.bookswap.service.BookService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final ExchangeRequestRepository exchangeRequestRepository;
    private final BookMapper bookMapper;

    public BookServiceImpl(BookRepository bookRepository,
                           UserRepository userRepository,
                           ExchangeRequestRepository exchangeRequestRepository,
                           BookMapper bookMapper) {
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.exchangeRequestRepository = exchangeRequestRepository;
        this.bookMapper = bookMapper;
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Override
    public BookResponse createBook(BookRequest request) {
        User owner = getAuthenticatedUser();
        Book book = bookMapper.toEntity(request, owner);
        Book savedBook = bookRepository.save(book);
        BookResponse response = bookMapper.toResponse(savedBook);
        response.setAvailable(true);
        return response;
    }

    @Override
    public BookResponse getBookById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));
        BookResponse response = bookMapper.toResponse(book);
        boolean isAvailable = !exchangeRequestRepository.existsByBookIdAndStatus(id, ExchangeRequestStatus.ACCEPTED);
        response.setAvailable(isAvailable);
        return response;
    }

    @Override
    public BookPageResponse getAllBooks(int page, int size, String sortBy, String direction) {
        Pageable pageable = createPageable(page, size, sortBy, direction);
        Page<Book> bookPage = bookRepository.findAll(pageable);
        return toPageResponse(bookPage);
    }

    @Override
    public BookResponse updateBook(Long id, BookRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));
        User currentUser = getAuthenticatedUser();

        if (!book.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }

        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setIsbn(request.getIsbn());
        book.setDescription(request.getDescription());
        book.setBookCondition(request.getBookCondition());

        Book updatedBook = bookRepository.save(book);
        BookResponse response = bookMapper.toResponse(updatedBook);
        boolean isAvailable = !exchangeRequestRepository.existsByBookIdAndStatus(id, ExchangeRequestStatus.ACCEPTED);
        response.setAvailable(isAvailable);
        return response;
    }

    @Override
    public void deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));
        User currentUser = getAuthenticatedUser();

        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase("ADMIN"));

        if (!book.getOwner().getId().equals(currentUser.getId()) && !isAdmin) {
            throw new AccessDeniedException("Access denied");
        }

        boolean hasAccepted = exchangeRequestRepository.existsByBookIdAndStatus(id, ExchangeRequestStatus.ACCEPTED);
        if (hasAccepted) {
            throw new IllegalArgumentException("Cannot delete a book with an accepted exchange request");
        }

        List<ExchangeRequest> requests = exchangeRequestRepository.findByBookId(id);
        if (!requests.isEmpty()) {
            exchangeRequestRepository.deleteAll(requests);
        }

        bookRepository.delete(book);
    }

    @Override
    public BookPageResponse searchBooks(String keyword, String condition, int page, int size, String sortBy, String direction) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new IllegalArgumentException("Search keyword is required");
        }

        BookCondition bookCondition = null;
        if (condition != null && !condition.trim().isEmpty()) {
            try {
                bookCondition = BookCondition.valueOf(condition.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid book condition");
            }
        }

        Pageable pageable = createPageable(page, size, sortBy, direction);
        Page<Book> bookPage = bookRepository.searchBooksCombined(keyword, bookCondition, pageable);
        return toPageResponse(bookPage);
    }

    @Override
    public BookPageResponse filterBooks(String condition, int page, int size, String sortBy, String direction) {
        BookCondition bookCondition;
        try {
            bookCondition = BookCondition.valueOf(condition.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid book condition");
        }

        Pageable pageable = createPageable(page, size, sortBy, direction);
        Page<Book> bookPage = bookRepository.findByBookCondition(bookCondition, pageable);
        return toPageResponse(bookPage);
    }

    @Override
    public BookPageResponse getBooksByOwner(Long ownerId, int page, int size, String sortBy, String direction) {
        if (!userRepository.existsById(ownerId)) {
            throw new ResourceNotFoundException("User not found");
        }
        Pageable pageable = createPageable(page, size, sortBy, direction);
        Page<Book> bookPage = bookRepository.findByOwnerId(ownerId, pageable);
        return toPageResponse(bookPage);
    }

    private Pageable createPageable(int page, int size, String sortBy, String direction) {
        if (!List.of("title", "author", "createdAt").contains(sortBy)) {
            throw new IllegalArgumentException("Invalid sort field");
        }
        if (!List.of("asc", "desc").contains(direction.toLowerCase())) {
            throw new IllegalArgumentException("Invalid sort direction");
        }
        Sort sort = Sort.by(Sort.Direction.fromString(direction.toLowerCase()), sortBy);
        return PageRequest.of(page, size, sort);
    }

    private BookPageResponse toPageResponse(Page<Book> bookPage) {
        List<BookResponse> content = bookPage.getContent().stream()
                .map(book -> {
                    BookResponse response = bookMapper.toResponse(book);
                    boolean isAvailable = !exchangeRequestRepository.existsByBookIdAndStatus(book.getId(), ExchangeRequestStatus.ACCEPTED);
                    response.setAvailable(isAvailable);
                    return response;
                })
                .collect(Collectors.toList());

        return new BookPageResponse(
                content,
                bookPage.getNumber(),
                bookPage.getSize(),
                bookPage.getTotalElements(),
                bookPage.getTotalPages(),
                bookPage.isLast()
        );
    }
}
