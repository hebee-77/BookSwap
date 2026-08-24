package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.constant.ExchangeEventType;
import com.hebee.bookswap.constant.ExchangeRequestStatus;
import com.hebee.bookswap.dto.*;
import com.hebee.bookswap.entity.*;
import com.hebee.bookswap.exception.InvalidReturnStateException;
import com.hebee.bookswap.exception.ResourceNotFoundException;
import com.hebee.bookswap.exception.ReturnRequestNotAllowedException;
import com.hebee.bookswap.mapper.ExchangeRequestMapper;
import com.hebee.bookswap.repository.BookRepository;
import com.hebee.bookswap.repository.ConversationRepository;
import com.hebee.bookswap.repository.ExchangeHistoryRepository;
import com.hebee.bookswap.repository.ExchangeRequestRepository;
import com.hebee.bookswap.repository.UserRepository;
import com.hebee.bookswap.service.ChatService;
import com.hebee.bookswap.service.ExchangeRequestService;
import com.hebee.bookswap.service.NotificationService;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    private final NotificationService notificationService;
    private final ExchangeHistoryRepository exchangeHistoryRepository;
    private final ConversationRepository conversationRepository;
    private final ChatService chatService;

    public ExchangeRequestServiceImpl(ExchangeRequestRepository exchangeRequestRepository,
                                      UserRepository userRepository,
                                      BookRepository bookRepository,
                                      ExchangeRequestMapper exchangeRequestMapper,
                                      NotificationService notificationService,
                                      ExchangeHistoryRepository exchangeHistoryRepository,
                                      ConversationRepository conversationRepository,
                                      @Lazy ChatService chatService) {
        this.exchangeRequestRepository = exchangeRequestRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.exchangeRequestMapper = exchangeRequestMapper;
        this.notificationService = notificationService;
        this.exchangeHistoryRepository = exchangeHistoryRepository;
        this.conversationRepository = conversationRepository;
        this.chatService = chatService;
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void recordHistory(ExchangeRequest exchange, User actor, ExchangeEventType eventType, String note) {
        ExchangeHistory history = new ExchangeHistory(exchange, actor, eventType, note);
        exchangeHistoryRepository.save(history);
    }

    private void sendChatSystemNotification(Long exchangeId, String content) {
        try {
            List<Conversation> convs = conversationRepository.findByExchangeRequestId(exchangeId);
            for (Conversation conv : convs) {
                chatService.sendSystemMessage(conv.getId(), content);
            }
        } catch (Exception e) {
            // Non-blocking: chat message failure should not abort exchange transaction
        }
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

        // Record history
        recordHistory(savedRequest, requester, ExchangeEventType.EXCHANGE_CREATED, "Exchange request submitted");

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
            throw new AccessDeniedException("Access denied: only the owner can accept this request");
        }

        if (exchangeRequest.getStatus() != ExchangeRequestStatus.PENDING) {
            throw new InvalidReturnStateException("Only pending requests can be accepted");
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

        // Record history
        recordHistory(savedRequest, currentUser, ExchangeEventType.EXCHANGE_ACCEPTED, "Exchange accepted; book transferred");

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

        sendChatSystemNotification(savedRequest.getId(), "Swap request accepted. Book transferred!");

        return exchangeRequestMapper.toResponse(savedRequest);
    }

    @Override
    public ExchangeRequestResponse rejectRequest(Long id) {
        ExchangeRequest exchangeRequest = exchangeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));
        User currentUser = getAuthenticatedUser();

        User owner = exchangeRequest.getOwner() != null ? exchangeRequest.getOwner() : exchangeRequest.getBook().getOwner();
        if (!owner.getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied: only the owner can reject this request");
        }

        if (exchangeRequest.getStatus() != ExchangeRequestStatus.PENDING) {
            throw new InvalidReturnStateException("Only pending requests can be rejected");
        }

        exchangeRequest.setStatus(ExchangeRequestStatus.REJECTED);
        ExchangeRequest savedRequest = exchangeRequestRepository.save(exchangeRequest);

        // Record history
        recordHistory(savedRequest, currentUser, ExchangeEventType.EXCHANGE_REJECTED, "Exchange request declined");

        // Notify the requester
        notificationService.createNotification(
            exchangeRequest.getRequester(),
            "REQUEST_REJECTED",
            String.format("Your swap request for \"%s\" was declined by %s.", exchangeRequest.getBook().getTitle(), currentUser.getName()),
            savedRequest.getId()
        );

        sendChatSystemNotification(savedRequest.getId(), "Swap request was declined.");

        return exchangeRequestMapper.toResponse(savedRequest);
    }

    // ==========================================
    // RETURN WORKFLOW IMPLEMENTATION
    // ==========================================

    @Override
    public ReturnDetailsResponseDTO requestReturn(Long exchangeId, ReturnRequestCreateDTO request) {
        ExchangeRequest exchange = exchangeRequestRepository.findById(exchangeId)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));
        User currentUser = getAuthenticatedUser();

        User owner = exchange.getOwner();
        if (owner == null || !owner.getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the original owner can request this book back");
        }

        if (owner.getId().equals(exchange.getRequester().getId())) {
            throw new ReturnRequestNotAllowedException("You cannot request a return from yourself");
        }

        ExchangeRequestStatus status = exchange.getStatus();
        if (status != ExchangeRequestStatus.ACCEPTED && status != ExchangeRequestStatus.RETURN_DECLINED) {
            if (status == ExchangeRequestStatus.RETURN_REQUESTED ||
                status == ExchangeRequestStatus.RETURN_ACCEPTED ||
                status == ExchangeRequestStatus.RETURN_IN_PROGRESS ||
                status == ExchangeRequestStatus.RETURNED) {
                throw new InvalidReturnStateException("An active return request is already in progress for this exchange");
            }
            if (status == ExchangeRequestStatus.COMPLETED) {
                throw new InvalidReturnStateException("This exchange has already been completed and returned");
            }
            throw new InvalidReturnStateException("Return can only be requested after the exchange is accepted/transferred");
        }

        exchange.setStatus(ExchangeRequestStatus.RETURN_REQUESTED);
        exchange.setReturnRequestedAt(LocalDateTime.now());
        if (request != null && request.getMessage() != null && !request.getMessage().trim().isEmpty()) {
            exchange.setReturnMessage(request.getMessage().trim());
        }

        ExchangeRequest saved = exchangeRequestRepository.save(exchange);

        String note = (request != null && request.getMessage() != null && !request.getMessage().trim().isEmpty())
                ? request.getMessage().trim()
                : "Owner initiated return request";

        recordHistory(saved, currentUser, ExchangeEventType.RETURN_REQUESTED, note);

        // Notify current book holder
        User holder = exchange.getRequester();
        notificationService.createNotification(
            holder,
            "RETURN_REQUESTED",
            String.format("%s requested the return of \"%s\".", currentUser.getName(), exchange.getBook().getTitle()),
            saved.getId()
        );

        sendChatSystemNotification(saved.getId(), "Return request sent for \"" + exchange.getBook().getTitle() + "\".");

        return mapToReturnDetails(saved, currentUser);
    }

    @Override
    public ReturnDetailsResponseDTO acceptReturn(Long exchangeId) {
        ExchangeRequest exchange = exchangeRequestRepository.findById(exchangeId)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));
        User currentUser = getAuthenticatedUser();

        User holder = exchange.getRequester();
        if (!holder.getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the current book holder can accept the return request");
        }

        if (exchange.getStatus() != ExchangeRequestStatus.RETURN_REQUESTED) {
            throw new InvalidReturnStateException("Cannot accept return: current status is " + exchange.getStatus());
        }

        exchange.setStatus(ExchangeRequestStatus.RETURN_IN_PROGRESS);
        exchange.setReturnAcceptedAt(LocalDateTime.now());
        exchange.setReturnStartedAt(LocalDateTime.now());

        ExchangeRequest saved = exchangeRequestRepository.save(exchange);

        recordHistory(saved, currentUser, ExchangeEventType.RETURN_ACCEPTED, "Holder accepted return request; return in progress");

        // Notify owner
        User owner = exchange.getOwner();
        notificationService.createNotification(
            owner,
            "RETURN_ACCEPTED",
            String.format("%s accepted your return request for \"%s\". Return is in progress.", currentUser.getName(), exchange.getBook().getTitle()),
            saved.getId()
        );

        sendChatSystemNotification(saved.getId(), "Return request accepted by " + currentUser.getName() + ". Return is in progress.");

        return mapToReturnDetails(saved, currentUser);
    }

    @Override
    public ReturnDetailsResponseDTO declineReturn(Long exchangeId, ReturnRequestCreateDTO request) {
        ExchangeRequest exchange = exchangeRequestRepository.findById(exchangeId)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));
        User currentUser = getAuthenticatedUser();

        User holder = exchange.getRequester();
        if (!holder.getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the current book holder can decline the return request");
        }

        if (exchange.getStatus() != ExchangeRequestStatus.RETURN_REQUESTED) {
            throw new InvalidReturnStateException("Cannot decline return: current status is " + exchange.getStatus());
        }

        exchange.setStatus(ExchangeRequestStatus.RETURN_DECLINED);
        exchange.setReturnDeclinedAt(LocalDateTime.now());
        if (request != null && request.getMessage() != null && !request.getMessage().trim().isEmpty()) {
            exchange.setReturnMessage(request.getMessage().trim());
        }

        ExchangeRequest saved = exchangeRequestRepository.save(exchange);

        String note = (request != null && request.getMessage() != null && !request.getMessage().trim().isEmpty())
                ? "Declined with reason: " + request.getMessage().trim()
                : "Holder declined return request";

        recordHistory(saved, currentUser, ExchangeEventType.RETURN_DECLINED, note);

        // Notify owner
        User owner = exchange.getOwner();
        notificationService.createNotification(
            owner,
            "RETURN_DECLINED",
            String.format("%s declined your return request for \"%s\".", currentUser.getName(), exchange.getBook().getTitle()),
            saved.getId()
        );

        sendChatSystemNotification(saved.getId(), "Return request was declined by " + currentUser.getName() + ".");

        return mapToReturnDetails(saved, currentUser);
    }

    @Override
    public ReturnDetailsResponseDTO markReturned(Long exchangeId) {
        ExchangeRequest exchange = exchangeRequestRepository.findById(exchangeId)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));
        User currentUser = getAuthenticatedUser();

        User holder = exchange.getRequester();
        if (!holder.getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the current book holder can mark the book as returned");
        }

        if (exchange.getStatus() != ExchangeRequestStatus.RETURN_IN_PROGRESS &&
            exchange.getStatus() != ExchangeRequestStatus.RETURN_ACCEPTED) {
            throw new InvalidReturnStateException("Book can only be marked as returned when return is in progress");
        }

        exchange.setStatus(ExchangeRequestStatus.RETURNED);
        exchange.setReturnedAt(LocalDateTime.now());

        ExchangeRequest saved = exchangeRequestRepository.save(exchange);

        recordHistory(saved, currentUser, ExchangeEventType.BOOK_RETURNED, "Holder marked the book as returned");

        // Notify owner
        User owner = exchange.getOwner();
        notificationService.createNotification(
            owner,
            "BOOK_RETURNED",
            String.format("%s marked \"%s\" as returned. Please confirm receipt once received.", currentUser.getName(), exchange.getBook().getTitle()),
            saved.getId()
        );

        sendChatSystemNotification(saved.getId(), "Book \"" + exchange.getBook().getTitle() + "\" marked as returned by " + currentUser.getName() + ". Awaiting owner confirmation.");

        return mapToReturnDetails(saved, currentUser);
    }

    @Override
    public ReturnDetailsResponseDTO confirmReceived(Long exchangeId) {
        ExchangeRequest exchange = exchangeRequestRepository.findById(exchangeId)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));
        User currentUser = getAuthenticatedUser();

        User owner = exchange.getOwner();
        if (owner == null || !owner.getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the original owner can confirm receipt of the returned book");
        }

        if (exchange.getStatus() != ExchangeRequestStatus.RETURNED) {
            throw new InvalidReturnStateException("Cannot confirm receipt: book has not yet been marked as returned");
        }

        // 1. Restore primary book ownership to the original owner
        Book book = exchange.getBook();
        book.setOwner(owner);
        bookRepository.save(book);

        // 2. Restore offered book ownership to requester if applicable
        if (exchange.getOfferedBook() != null) {
            Book offeredBook = exchange.getOfferedBook();
            offeredBook.setOwner(exchange.getRequester());
            bookRepository.save(offeredBook);
        }

        exchange.setStatus(ExchangeRequestStatus.COMPLETED);
        exchange.setConfirmedAt(LocalDateTime.now());

        ExchangeRequest saved = exchangeRequestRepository.save(exchange);

        recordHistory(saved, currentUser, ExchangeEventType.OWNER_CONFIRMED, "Owner confirmed receipt of returned book");
        recordHistory(saved, currentUser, ExchangeEventType.EXCHANGE_COMPLETED, "Return cycle completed; book ownership returned to original owner");

        // Notify both parties
        User holder = exchange.getRequester();
        notificationService.createNotification(
            holder,
            "RETURN_COMPLETED",
            String.format("%s confirmed receipt of \"%s\". The exchange and return cycle is now complete!", currentUser.getName(), book.getTitle()),
            saved.getId()
        );

        notificationService.createNotification(
            owner,
            "RETURN_COMPLETED",
            String.format("You confirmed receipt of \"%s\". The book is back in your shelf!", book.getTitle()),
            saved.getId()
        );

        sendChatSystemNotification(saved.getId(), "Book return completed! " + currentUser.getName() + " confirmed receipt of \"" + book.getTitle() + "\".");

        return mapToReturnDetails(saved, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnDetailsResponseDTO getReturnDetails(Long exchangeId) {
        ExchangeRequest exchange = exchangeRequestRepository.findById(exchangeId)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));
        User currentUser = getAuthenticatedUser();

        boolean isParticipant = (exchange.getOwner() != null && exchange.getOwner().getId().equals(currentUser.getId())) ||
                                (exchange.getRequester() != null && exchange.getRequester().getId().equals(currentUser.getId()));
        if (!isParticipant) {
            throw new AccessDeniedException("Access denied: You are not a participant in this exchange");
        }

        return mapToReturnDetails(exchange, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExchangeHistoryResponseDTO> getExchangeHistory(Long exchangeId) {
        ExchangeRequest exchange = exchangeRequestRepository.findById(exchangeId)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));
        User currentUser = getAuthenticatedUser();

        boolean isParticipant = (exchange.getOwner() != null && exchange.getOwner().getId().equals(currentUser.getId())) ||
                                (exchange.getRequester() != null && exchange.getRequester().getId().equals(currentUser.getId()));
        if (!isParticipant) {
            throw new AccessDeniedException("Access denied: You are not a participant in this exchange");
        }

        return exchangeHistoryRepository.findByExchangeRequestIdOrderByCreatedAtAsc(exchangeId)
                .stream()
                .map(this::mapToHistoryDTO)
                .collect(Collectors.toList());
    }

    private ReturnDetailsResponseDTO mapToReturnDetails(ExchangeRequest exchange, User currentUser) {
        ReturnDetailsResponseDTO dto = new ReturnDetailsResponseDTO();
        dto.setExchangeId(exchange.getId());
        dto.setStatus(exchange.getStatus());

        if (exchange.getBook() != null) {
            dto.setBookId(exchange.getBook().getId());
            dto.setBookTitle(exchange.getBook().getTitle());
            dto.setBookAuthor(exchange.getBook().getAuthor());
            dto.setBookImageUrl(exchange.getBook().getImageUrl());
        }

        if (exchange.getOfferedBook() != null) {
            dto.setOfferedBookId(exchange.getOfferedBook().getId());
            dto.setOfferedBookTitle(exchange.getOfferedBook().getTitle());
            dto.setOfferedBookAuthor(exchange.getOfferedBook().getAuthor());
            dto.setOfferedBookImageUrl(exchange.getOfferedBook().getImageUrl());
        }

        if (exchange.getOwner() != null) {
            dto.setOwnerId(exchange.getOwner().getId());
            dto.setOwnerName(exchange.getOwner().getName());
        }

        if (exchange.getRequester() != null) {
            dto.setRequesterId(exchange.getRequester().getId());
            dto.setRequesterName(exchange.getRequester().getName());
            dto.setCurrentHolderId(exchange.getRequester().getId());
            dto.setCurrentHolderName(exchange.getRequester().getName());
        }

        dto.setExchangeCreatedAt(exchange.getCreatedAt());
        dto.setReturnRequestedAt(exchange.getReturnRequestedAt());
        dto.setReturnAcceptedAt(exchange.getReturnAcceptedAt());
        dto.setReturnDeclinedAt(exchange.getReturnDeclinedAt());
        dto.setReturnStartedAt(exchange.getReturnStartedAt());
        dto.setReturnedAt(exchange.getReturnedAt());
        dto.setConfirmedAt(exchange.getConfirmedAt());
        dto.setReturnMessage(exchange.getReturnMessage());

        // Derive allowed actions for currentUser
        boolean isOwner = exchange.getOwner() != null && exchange.getOwner().getId().equals(currentUser.getId());
        boolean isHolder = exchange.getRequester() != null && exchange.getRequester().getId().equals(currentUser.getId());
        ExchangeRequestStatus s = exchange.getStatus();

        dto.setCanRequestReturn(isOwner && (s == ExchangeRequestStatus.ACCEPTED || s == ExchangeRequestStatus.RETURN_DECLINED));
        dto.setCanAcceptReturn(isHolder && s == ExchangeRequestStatus.RETURN_REQUESTED);
        dto.setCanDeclineReturn(isHolder && s == ExchangeRequestStatus.RETURN_REQUESTED);
        dto.setCanMarkReturned(isHolder && (s == ExchangeRequestStatus.RETURN_IN_PROGRESS || s == ExchangeRequestStatus.RETURN_ACCEPTED));
        dto.setCanConfirmReceived(isOwner && s == ExchangeRequestStatus.RETURNED);

        // Map audit history
        List<ExchangeHistoryResponseDTO> historyList = exchangeHistoryRepository
                .findByExchangeRequestIdOrderByCreatedAtAsc(exchange.getId())
                .stream()
                .map(this::mapToHistoryDTO)
                .collect(Collectors.toList());
        dto.setHistory(historyList);

        return dto;
    }

    private ExchangeHistoryResponseDTO mapToHistoryDTO(ExchangeHistory h) {
        return new ExchangeHistoryResponseDTO(
                h.getId(),
                h.getExchangeRequest() != null ? h.getExchangeRequest().getId() : null,
                h.getActor() != null ? h.getActor().getId() : null,
                h.getActor() != null ? h.getActor().getName() : "System",
                h.getActor() != null ? h.getActor().getEmail() : null,
                h.getEventType(),
                h.getCreatedAt(),
                h.getNote()
        );
    }
}
