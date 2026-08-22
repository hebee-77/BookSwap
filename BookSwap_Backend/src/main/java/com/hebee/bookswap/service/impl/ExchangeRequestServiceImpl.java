package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.constant.ExchangeRequestStatus;
import com.hebee.bookswap.dto.ExchangeRequestCreate;
import com.hebee.bookswap.dto.ExchangeRequestResponse;
import com.hebee.bookswap.entity.Book;
import com.hebee.bookswap.entity.ExchangeRequest;
import com.hebee.bookswap.entity.User;
import com.hebee.bookswap.exception.ResourceNotFoundException;
import com.hebee.bookswap.mapper.ExchangeRequestMapper;
import com.hebee.bookswap.repository.BookRepository;
import com.hebee.bookswap.repository.ExchangeRequestRepository;
import com.hebee.bookswap.repository.UserRepository;
import com.hebee.bookswap.service.ExchangeRequestService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@SuppressWarnings("null")
public class ExchangeRequestServiceImpl implements ExchangeRequestService {

    private final ExchangeRequestRepository exchangeRequestRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final ExchangeRequestMapper exchangeRequestMapper;
    private final com.hebee.bookswap.service.NotificationService notificationService;

    public ExchangeRequestServiceImpl(ExchangeRequestRepository exchangeRequestRepository,
                                      UserRepository userRepository,
                                      BookRepository bookRepository,
                                      ExchangeRequestMapper exchangeRequestMapper,
                                      com.hebee.bookswap.service.NotificationService notificationService) {
        this.exchangeRequestRepository = exchangeRequestRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.exchangeRequestMapper = exchangeRequestMapper;
        this.notificationService = notificationService;
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Override
    public ExchangeRequestResponse createRequest(ExchangeRequestCreate request) {
        User requester = getAuthenticatedUser();
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        if (book.getOwner().getId().equals(requester.getId())) {
            throw new IllegalArgumentException("You cannot request your own book");
        }

        if (exchangeRequestRepository.existsByRequesterIdAndBookIdAndStatus(
                requester.getId(), book.getId(), ExchangeRequestStatus.PENDING)) {
            throw new IllegalArgumentException("A pending request already exists for this book");
        }

        Book offeredBook = null;
        if (request.getOfferedBookId() != null) {
            offeredBook = bookRepository.findById(request.getOfferedBookId())
                    .orElseThrow(() -> new ResourceNotFoundException("Offered book not found"));

            if (!offeredBook.getOwner().getId().equals(requester.getId())) {
                throw new IllegalArgumentException("You can only offer books that you own");
            }

            if (offeredBook.getId().equals(book.getId())) {
                throw new IllegalArgumentException("Offered book cannot be the same as requested book");
            }
        }

        User owner = book.getOwner();
        ExchangeRequest exchangeRequest = exchangeRequestMapper.toEntity(request, requester, owner, book, offeredBook);
        exchangeRequest.setStatus(ExchangeRequestStatus.PENDING);

        ExchangeRequest savedRequest = exchangeRequestRepository.save(exchangeRequest);

        // Notify the owner of the requested book
        String notificationMsg = offeredBook != null
                ? String.format("User %s requested your book \"%s\" and offered \"%s\" in exchange.", requester.getName(), book.getTitle(), offeredBook.getTitle())
                : String.format("User %s requested your book \"%s\".", requester.getName(), book.getTitle());

        notificationService.createNotification(
            owner,
            "SWAP_REQUEST",
            notificationMsg,
            savedRequest.getId()
        );

        return exchangeRequestMapper.toResponse(savedRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public ExchangeRequestResponse getRequestById(Long id) {
        ExchangeRequest exchangeRequest = exchangeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));
        return exchangeRequestMapper.toResponse(exchangeRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExchangeRequestResponse> getAllRequests() {
        return exchangeRequestRepository.findAll().stream()
                .map(exchangeRequestMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExchangeRequestResponse> getRequestsByRequester(Long requesterId) {
        if (!userRepository.existsById(requesterId)) {
            throw new ResourceNotFoundException("User not found");
        }
        return exchangeRequestRepository.findByRequesterId(requesterId).stream()
                .map(exchangeRequestMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExchangeRequestResponse> getRequestsByBook(Long bookId) {
        if (!bookRepository.existsById(bookId)) {
            throw new ResourceNotFoundException("Book not found");
        }
        return exchangeRequestRepository.findByBookId(bookId).stream()
                .map(exchangeRequestMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ExchangeRequestResponse acceptRequest(Long id) {
        ExchangeRequest exchangeRequest = exchangeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));
        User currentUser = getAuthenticatedUser();

        User owner = exchangeRequest.getOwner() != null ? exchangeRequest.getOwner() : exchangeRequest.getBook().getOwner();
        if (!owner.getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }

        if (exchangeRequest.getStatus() != ExchangeRequestStatus.PENDING) {
            throw new IllegalArgumentException("Only pending requests can be updated");
        }

        exchangeRequest.setStatus(ExchangeRequestStatus.ACCEPTED);
        ExchangeRequest savedRequest = exchangeRequestRepository.save(exchangeRequest);

        // Perform Book Ownership Transfer
        Book requestedBook = exchangeRequest.getBook();
        User requester = exchangeRequest.getRequester();

        // 1. Requester receives the requested book
        requestedBook.setOwner(requester);
        bookRepository.save(requestedBook);

        // 2. Sender receives the proposed book
        if (exchangeRequest.getOfferedBook() != null) {
            Book offeredBook = exchangeRequest.getOfferedBook();
            offeredBook.setOwner(currentUser);
            bookRepository.save(offeredBook);
        }

        // Notify the requester
        notificationService.createNotification(
            requester,
            "REQUEST_ACCEPTED",
            String.format("Your swap request for \"%s\" was accepted by %s! You received \"%s\".",
                    requestedBook.getTitle(), currentUser.getName(), requestedBook.getTitle()),
            savedRequest.getId()
        );

        // Notify the owner/sender
        if (exchangeRequest.getOfferedBook() != null) {
            notificationService.createNotification(
                currentUser,
                "REQUEST_ACCEPTED",
                String.format("You accepted the swap for \"%s\" and received \"%s\" from %s!",
                        requestedBook.getTitle(), exchangeRequest.getOfferedBook().getTitle(), requester.getName()),
                savedRequest.getId()
            );
        }

        return exchangeRequestMapper.toResponse(savedRequest);
    }

    @Override
    public ExchangeRequestResponse rejectRequest(Long id) {
        ExchangeRequest exchangeRequest = exchangeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));
        User currentUser = getAuthenticatedUser();

        User owner = exchangeRequest.getOwner() != null ? exchangeRequest.getOwner() : exchangeRequest.getBook().getOwner();
        if (!owner.getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }

        if (exchangeRequest.getStatus() != ExchangeRequestStatus.PENDING) {
            throw new IllegalArgumentException("Only pending requests can be updated");
        }

        exchangeRequest.setStatus(ExchangeRequestStatus.REJECTED);
        ExchangeRequest savedRequest = exchangeRequestRepository.save(exchangeRequest);

        // Notify the requester
        notificationService.createNotification(
            exchangeRequest.getRequester(),
            "REQUEST_REJECTED",
            String.format("Your swap request for \"%s\" was declined by %s.", exchangeRequest.getBook().getTitle(), currentUser.getName()),
            savedRequest.getId()
        );

        return exchangeRequestMapper.toResponse(savedRequest);
    }
}
