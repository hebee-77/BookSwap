package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.constant.ExchangeEventType;
import com.hebee.bookswap.constant.ExchangeRequestStatus;
import com.hebee.bookswap.constant.ReturnOtpStatus;
import com.hebee.bookswap.dto.*;
import com.hebee.bookswap.entity.*;
import com.hebee.bookswap.exception.*;
import com.hebee.bookswap.mapper.ExchangeRequestMapper;
import com.hebee.bookswap.repository.*;
import com.hebee.bookswap.service.ChatService;
import com.hebee.bookswap.service.ExchangeRequestService;
import com.hebee.bookswap.service.NotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@SuppressWarnings("null")
public class ExchangeRequestServiceImpl implements ExchangeRequestService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final List<ExchangeRequestStatus> ACTIVE_EXCHANGE_STATUSES = List.of(
            ExchangeRequestStatus.ACCEPTED,
            ExchangeRequestStatus.RETURN_REQUESTED,
            ExchangeRequestStatus.RETURN_ACCEPTED,
            ExchangeRequestStatus.RETURN_IN_PROGRESS,
            ExchangeRequestStatus.RETURNED
    );

    private final ExchangeRequestRepository exchangeRequestRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final ExchangeRequestMapper exchangeRequestMapper;
    private final NotificationService notificationService;
    private final ExchangeHistoryRepository exchangeHistoryRepository;
    private final ConversationRepository conversationRepository;
    private final ChatService chatService;
    private final ReturnVerificationRepository returnVerificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${bookswap.return.otp.expiration-minutes:30}")
    private int otpExpirationMinutes = 30;

    @Value("${bookswap.return.otp.max-attempts:5}")
    private int otpMaxAttempts = 5;

    @Value("${bookswap.return.otp.cooldown-seconds:30}")
    private int otpCooldownSeconds = 30;

    public ExchangeRequestServiceImpl(ExchangeRequestRepository exchangeRequestRepository,
                                      UserRepository userRepository,
                                      BookRepository bookRepository,
                                      ExchangeRequestMapper exchangeRequestMapper,
                                      NotificationService notificationService,
                                      ExchangeHistoryRepository exchangeHistoryRepository,
                                      ConversationRepository conversationRepository,
                                      @Lazy ChatService chatService,
                                      ReturnVerificationRepository returnVerificationRepository,
                                      PasswordEncoder passwordEncoder) {
        this.exchangeRequestRepository = exchangeRequestRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.exchangeRequestMapper = exchangeRequestMapper;
        this.notificationService = notificationService;
        this.exchangeHistoryRepository = exchangeHistoryRepository;
        this.conversationRepository = conversationRepository;
        this.chatService = chatService;
        this.returnVerificationRepository = returnVerificationRepository;
        this.passwordEncoder = passwordEncoder;
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

    private String generateSecureOtp() {
        int number = SECURE_RANDOM.nextInt(900000) + 100000; // Guarantees exactly 6 digits: 100000 to 999999
        return String.valueOf(number);
    }

    @Override
    public ExchangeRequestResponse createRequest(ExchangeRequestCreate request) {
        User requester = getAuthenticatedUser();
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        if (book.getOwner().getId().equals(requester.getId())) {
            throw new IllegalArgumentException("You cannot request your own book");
        }

        // Prevent duplicate pending requests from the same user for the same book
        if (exchangeRequestRepository.existsByRequesterIdAndBookIdAndStatus(
                requester.getId(), book.getId(), ExchangeRequestStatus.PENDING)) {
            throw new IllegalArgumentException("You already have a pending exchange request for this book");
        }

        // Prevent requesting books that are currently in an active exchange/loan
        if (exchangeRequestRepository.existsByBookIdAndStatusIn(book.getId(), ACTIVE_EXCHANGE_STATUSES)) {
            throw new IllegalArgumentException("This book is currently in an active exchange and is not available.");
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

            // Prevent offering books that are currently in an active exchange/loan
            if (exchangeRequestRepository.existsByBookIdAndStatusIn(offeredBook.getId(), ACTIVE_EXCHANGE_STATUSES) ||
                exchangeRequestRepository.existsByOfferedBookIdAndStatusIn(offeredBook.getId(), ACTIVE_EXCHANGE_STATUSES)) {
                throw new IllegalArgumentException("Your offered book is currently in an active exchange and is not available.");
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
    public List<ExchangeRequestResponse> getMyRequests() {
        User currentUser = getAuthenticatedUser();
        return exchangeRequestRepository.findByUserParticipantOrderByCreatedAtDesc(currentUser.getId()).stream()
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

        // 3. Auto-close / decline all other competing PENDING requests for this book to prevent duplicates
        List<ExchangeRequest> otherPendingForBook = exchangeRequestRepository.findByBookIdAndStatus(requestedBook.getId(), ExchangeRequestStatus.PENDING);
        for (ExchangeRequest other : otherPendingForBook) {
            if (!other.getId().equals(savedRequest.getId())) {
                other.setStatus(ExchangeRequestStatus.REJECTED);
                exchangeRequestRepository.save(other);
                recordHistory(other, currentUser, ExchangeEventType.EXCHANGE_REJECTED, "Automatically declined because book was swapped with another user");
                notificationService.createNotification(
                    other.getRequester(),
                    "REQUEST_REJECTED",
                    String.format("Your request for \"%s\" was automatically closed because the owner accepted another exchange.", requestedBook.getTitle()),
                    other.getId()
                );
            }
        }

        // Auto-close competing requests for the offered book if present
        if (exchangeRequest.getOfferedBook() != null) {
            Book offeredBook = exchangeRequest.getOfferedBook();
            List<ExchangeRequest> otherPendingForOffered = exchangeRequestRepository.findByBookIdAndStatus(offeredBook.getId(), ExchangeRequestStatus.PENDING);
            for (ExchangeRequest other : otherPendingForOffered) {
                if (!other.getId().equals(savedRequest.getId())) {
                    other.setStatus(ExchangeRequestStatus.REJECTED);
                    exchangeRequestRepository.save(other);
                    recordHistory(other, currentUser, ExchangeEventType.EXCHANGE_REJECTED, "Automatically declined because offered book was swapped");
                }
            }
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

    // ==========================================
    // SECURE OTP-BASED PHYSICAL RETURN VERIFICATION
    // ==========================================

    @Override
    public ReturnOtpGenerateResponseDTO generateReturnOtp(Long exchangeId) {
        ExchangeRequest exchange = exchangeRequestRepository.findById(exchangeId)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));
        User currentUser = getAuthenticatedUser();

        // 1. Authorization: Original book owner only
        User owner = exchange.getOwner();
        if (owner == null || !owner.getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the original book owner can generate a return verification code.");
        }

        // 2. State validation: Must be in RETURN_IN_PROGRESS or RETURN_ACCEPTED
        if (exchange.getStatus() != ExchangeRequestStatus.RETURN_IN_PROGRESS &&
            exchange.getStatus() != ExchangeRequestStatus.RETURN_ACCEPTED) {
            throw new InvalidReturnStateException("Return code can only be generated when return is in progress.");
        }

        // 3. Cooldown verification: Prevent rapid repeated generation
        Optional<ReturnVerification> activeOtpOpt = returnVerificationRepository
                .findFirstByExchangeRequestIdAndStatusOrderByCreatedAtDesc(exchangeId, ReturnOtpStatus.ACTIVE);

        boolean isRegeneration = activeOtpOpt.isPresent();

        if (activeOtpOpt.isPresent()) {
            ReturnVerification active = activeOtpOpt.get();
            long secondsSinceGenerated = Duration.between(active.getGeneratedAt(), LocalDateTime.now()).getSeconds();
            if (secondsSinceGenerated < otpCooldownSeconds) {
                long waitRemaining = otpCooldownSeconds - secondsSinceGenerated;
                throw new ReturnOtpNotAllowedException(
                    String.format("Please wait %d seconds before generating a new return verification code.", waitRemaining)
                );
            }
            // Invalidate the previous active OTP
            active.setStatus(ReturnOtpStatus.EXPIRED);
            returnVerificationRepository.save(active);
        }

        // Invalidate any other active verifications for safety
        List<ReturnVerification> activeList = returnVerificationRepository.findByExchangeRequestIdAndStatus(exchangeId, ReturnOtpStatus.ACTIVE);
        for (ReturnVerification rv : activeList) {
            rv.setStatus(ReturnOtpStatus.EXPIRED);
            returnVerificationRepository.save(rv);
        }

        // 4. Generate 6-digit numeric OTP via SecureRandom
        String rawOtp = generateSecureOtp();
        String otpHash = passwordEncoder.encode(rawOtp);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(otpExpirationMinutes);

        // 5. Store hashed OTP in return_verifications
        ReturnVerification newVerification = new ReturnVerification(exchange, otpHash, expiresAt, otpMaxAttempts);
        returnVerificationRepository.save(newVerification);

        // 6. Record audit event (NEVER log the raw OTP)
        ExchangeEventType eventType = isRegeneration ? ExchangeEventType.RETURN_OTP_REGENERATED : ExchangeEventType.RETURN_OTP_GENERATED;
        String eventNote = isRegeneration
                ? "Owner regenerated return verification code (valid for " + otpExpirationMinutes + " minutes)"
                : "Owner generated return verification code (valid for " + otpExpirationMinutes + " minutes)";
        recordHistory(exchange, currentUser, eventType, eventNote);

        // 7. Notify holder (NEVER include raw OTP)
        notificationService.createNotification(
            exchange.getRequester(),
            "RETURN_OTP_GENERATED",
            String.format("The owner generated a return verification code for \"%s\". Please enter the code after receiving/returning the book.", exchange.getBook().getTitle()),
            exchange.getId()
        );

        // 8. Return response containing OTP exclusively to the authenticated owner
        return new ReturnOtpGenerateResponseDTO(exchangeId, ReturnOtpStatus.ACTIVE, rawOtp, expiresAt);
    }

    @Override
    public ReturnDetailsResponseDTO verifyReturnOtp(Long exchangeId, ReturnOtpVerifyRequestDTO request) {
        ExchangeRequest exchange = exchangeRequestRepository.findById(exchangeId)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));
        User currentUser = getAuthenticatedUser();

        // 1. Authorization: Current book holder only
        User holder = exchange.getRequester();
        if (holder == null || !holder.getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the current book holder can verify the return code.");
        }

        // 2. State validation: Must be RETURN_IN_PROGRESS or RETURN_ACCEPTED
        if (exchange.getStatus() != ExchangeRequestStatus.RETURN_IN_PROGRESS &&
            exchange.getStatus() != ExchangeRequestStatus.RETURN_ACCEPTED) {
            throw new InvalidReturnStateException("Return verification can only be performed when return is in progress.");
        }

        // 3. Format validation
        if (request == null || request.getOtp() == null || !request.getOtp().trim().matches("^[0-9]{6}$")) {
            throw new InvalidReturnOtpException("Verification code must be exactly 6 digits.");
        }

        // 4. Find active verification
        ReturnVerification verification = returnVerificationRepository
                .findFirstByExchangeRequestIdAndStatusOrderByCreatedAtDesc(exchangeId, ReturnOtpStatus.ACTIVE)
                .orElseThrow(() -> new ReturnOtpNotFoundException("No active return verification code found. Please ask the owner to generate a code."));

        // 5. Expiration check
        if (LocalDateTime.now().isAfter(verification.getExpiresAt())) {
            verification.setStatus(ReturnOtpStatus.EXPIRED);
            returnVerificationRepository.save(verification);
            recordHistory(exchange, currentUser, ExchangeEventType.RETURN_OTP_EXPIRED, "Return verification code expired");
            throw new ReturnOtpExpiredException("Verification code has expired. Please ask the owner to generate a new code.");
        }

        // 6. Lock check
        if (verification.getStatus() == ReturnOtpStatus.LOCKED || verification.getAttemptCount() >= verification.getMaxAttempts()) {
            throw new ReturnOtpLockedException("Return verification code is locked after too many failed attempts. Please ask the owner to generate a new code.");
        }

        // 7. Verify hash
        boolean matches = passwordEncoder.matches(request.getOtp().trim(), verification.getOtpHash());

        if (!matches) {
            int newAttemptCount = verification.getAttemptCount() + 1;
            verification.setAttemptCount(newAttemptCount);

            if (newAttemptCount >= verification.getMaxAttempts()) {
                verification.setStatus(ReturnOtpStatus.LOCKED);
                returnVerificationRepository.save(verification);

                recordHistory(exchange, currentUser, ExchangeEventType.RETURN_OTP_LOCKED, "Return verification code locked due to maximum failed attempts");

                // Notify owner that code was locked
                notificationService.createNotification(
                    exchange.getOwner(),
                    "RETURN_OTP_LOCKED",
                    String.format("The return verification code for \"%s\" was locked after %d failed attempts.", exchange.getBook().getTitle(), verification.getMaxAttempts()),
                    exchange.getId()
                );

                throw new ReturnOtpLockedException("Too many incorrect attempts. The return code is locked. Please ask the owner to generate a new code.");
            }

            returnVerificationRepository.save(verification);
            int remaining = verification.getMaxAttempts() - newAttemptCount;
            throw new InvalidReturnOtpException(
                String.format("Incorrect verification code. %d attempt%s remaining.", remaining, remaining == 1 ? "" : "s")
            );
        }

        // 8. Success: Mark verification as VERIFIED
        verification.setStatus(ReturnOtpStatus.VERIFIED);
        verification.setVerifiedAt(LocalDateTime.now());
        returnVerificationRepository.save(verification);

        // 9. Transition exchange state to RETURNED
        exchange.setStatus(ExchangeRequestStatus.RETURNED);
        exchange.setReturnedAt(LocalDateTime.now());

        ExchangeRequest saved = exchangeRequestRepository.save(exchange);

        // 10. Audit history
        recordHistory(saved, currentUser, ExchangeEventType.RETURN_OTP_VERIFIED, "Return code verified successfully by holder");
        recordHistory(saved, currentUser, ExchangeEventType.BOOK_RETURNED, "Book handed over and marked as returned via physical OTP verification");

        // 11. Notifications
        User owner = exchange.getOwner();
        notificationService.createNotification(
            owner,
            "BOOK_RETURNED",
            String.format("%s entered the correct return code. Please confirm receipt of \"%s\" once received.", currentUser.getName(), exchange.getBook().getTitle()),
            saved.getId()
        );

        notificationService.createNotification(
            currentUser,
            "RETURN_OTP_VERIFIED",
            String.format("Return code verified successfully for \"%s\". Awaiting owner receipt confirmation.", exchange.getBook().getTitle()),
            saved.getId()
        );

        sendChatSystemNotification(saved.getId(), "Physical return verified via code! Book \"" + exchange.getBook().getTitle() + "\" is marked as returned. Awaiting owner receipt confirmation.");

        return mapToReturnDetails(saved, currentUser);
    }

    @Override
    public ReturnDetailsResponseDTO markReturned(Long exchangeId) {
        // Direct unverified mark-returned is deprecated and disallowed
        throw new ReturnOtpNotAllowedException("Direct return marking is disabled. Physical book return requires 6-digit OTP verification provided by the book owner.");
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
            throw new InvalidReturnStateException("Cannot confirm receipt: book has not yet been marked as returned via OTP verification");
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

        // Check active OTP metadata
        Optional<ReturnVerification> activeOtpOpt = returnVerificationRepository
                .findFirstByExchangeRequestIdAndStatusOrderByCreatedAtDesc(exchange.getId(), ReturnOtpStatus.ACTIVE);

        boolean hasActiveOtp = activeOtpOpt.isPresent() && !LocalDateTime.now().isAfter(activeOtpOpt.get().getExpiresAt());
        dto.setHasActiveReturnOtp(hasActiveOtp);
        dto.setReturnOtpExpiresAt(hasActiveOtp ? activeOtpOpt.get().getExpiresAt() : null);

        // Derive allowed actions for currentUser
        boolean isOwner = exchange.getOwner() != null && exchange.getOwner().getId().equals(currentUser.getId());
        boolean isHolder = exchange.getRequester() != null && exchange.getRequester().getId().equals(currentUser.getId());
        ExchangeRequestStatus s = exchange.getStatus();

        dto.setCanRequestReturn(isOwner && (s == ExchangeRequestStatus.ACCEPTED || s == ExchangeRequestStatus.RETURN_DECLINED));
        dto.setCanAcceptReturn(isHolder && s == ExchangeRequestStatus.RETURN_REQUESTED);
        dto.setCanDeclineReturn(isHolder && s == ExchangeRequestStatus.RETURN_REQUESTED);
        dto.setCanGenerateReturnOtp(isOwner && (s == ExchangeRequestStatus.RETURN_IN_PROGRESS || s == ExchangeRequestStatus.RETURN_ACCEPTED));
        dto.setCanVerifyReturnOtp(isHolder && (s == ExchangeRequestStatus.RETURN_IN_PROGRESS || s == ExchangeRequestStatus.RETURN_ACCEPTED));
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
