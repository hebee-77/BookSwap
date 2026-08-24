package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.constant.BookCondition;
import com.hebee.bookswap.constant.ExchangeEventType;
import com.hebee.bookswap.constant.ExchangeRequestStatus;
import com.hebee.bookswap.constant.ReturnOtpStatus;
import com.hebee.bookswap.dto.*;
import com.hebee.bookswap.entity.*;
import com.hebee.bookswap.exception.*;
import com.hebee.bookswap.mapper.ExchangeRequestMapper;
import com.hebee.bookswap.repository.*;
import com.hebee.bookswap.service.ChatService;
import com.hebee.bookswap.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class ExchangeRequestServiceImplTest {

    @Mock
    private ExchangeRequestRepository exchangeRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ExchangeHistoryRepository exchangeHistoryRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ChatService chatService;

    @Mock
    private ReturnVerificationRepository returnVerificationRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private ExchangeRequestServiceImpl exchangeRequestService;

    private User requester;
    private User sender;
    private Book requestedBook;
    private Book offeredBook;

    @BeforeEach
    void setUp() {
        exchangeRequestService = new ExchangeRequestServiceImpl(
                exchangeRequestRepository,
                userRepository,
                bookRepository,
                new ExchangeRequestMapper(),
                notificationService,
                exchangeHistoryRepository,
                conversationRepository,
                chatService,
                returnVerificationRepository,
                passwordEncoder
        );

        requester = new User("Requester User", "requester@example.com", "password");
        requester.setId(1L);

        sender = new User("Sender User", "sender@example.com", "password");
        sender.setId(2L);

        requestedBook = new Book("Clean Code", "Robert Martin", "111", "Desc", BookCondition.GOOD, sender);
        requestedBook.setId(101L);

        offeredBook = new Book("Refactoring", "Martin Fowler", "222", "Desc", BookCondition.GOOD, requester);
        offeredBook.setId(202L);

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("requester@example.com", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testCreateRequest_Success_WithOfferedBook() {
        ExchangeRequestCreate request = new ExchangeRequestCreate(101L, 202L);

        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));
        when(bookRepository.findById(101L)).thenReturn(Optional.of(requestedBook));
        when(bookRepository.findById(202L)).thenReturn(Optional.of(offeredBook));
        when(exchangeRequestRepository.existsByRequesterIdAndBookIdAndStatus(1L, 101L, ExchangeRequestStatus.PENDING))
                .thenReturn(false);
        when(exchangeRequestRepository.existsByBookIdAndStatusIn(eq(101L), any())).thenReturn(false);
        when(exchangeRequestRepository.existsByBookIdAndStatusIn(eq(202L), any())).thenReturn(false);
        when(exchangeRequestRepository.existsByOfferedBookIdAndStatusIn(eq(202L), any())).thenReturn(false);
        when(exchangeRequestRepository.save(any(ExchangeRequest.class))).thenAnswer(invocation -> {
            ExchangeRequest req = invocation.getArgument(0);
            req.setId(10L);
            return req;
        });

        ExchangeRequestResponse response = exchangeRequestService.createRequest(request);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals(1L, response.getRequesterId());
        assertEquals(2L, response.getOwnerId());
        assertEquals(101L, response.getBookId());
        assertEquals(202L, response.getOfferedBookId());
        assertEquals(ExchangeRequestStatus.PENDING, response.getStatus());

        verify(notificationService, times(1)).createNotification(
                eq(sender), eq("SWAP_REQUEST"), anyString(), eq(10L)
        );
        verify(exchangeHistoryRepository, times(1)).save(any(ExchangeHistory.class));
    }

    @Test
    void testCreateRequest_Fails_WhenBookInActiveExchange() {
        ExchangeRequestCreate request = new ExchangeRequestCreate(101L, null);

        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));
        when(bookRepository.findById(101L)).thenReturn(Optional.of(requestedBook));
        when(exchangeRequestRepository.existsByRequesterIdAndBookIdAndStatus(1L, 101L, ExchangeRequestStatus.PENDING))
                .thenReturn(false);
        when(exchangeRequestRepository.existsByBookIdAndStatusIn(eq(101L), any())).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                exchangeRequestService.createRequest(request)
        );
        assertTrue(ex.getMessage().contains("currently in an active exchange"));
    }

    @Test
    void testCreateRequest_Fails_WhenOfferingBookNotOwned() {
        ExchangeRequestCreate request = new ExchangeRequestCreate(101L, 202L);
        offeredBook.setOwner(sender); // not owned by requester

        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));
        when(bookRepository.findById(101L)).thenReturn(Optional.of(requestedBook));
        when(bookRepository.findById(202L)).thenReturn(Optional.of(offeredBook));

        assertThrows(IllegalArgumentException.class, () -> exchangeRequestService.createRequest(request));
    }

    @Test
    void testAcceptRequest_TransfersBothBooksOwnership_AndAutoClosesCompeting() {
        // Authenticated as sender (owner of requestedBook)
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("sender@example.com", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.PENDING);
        exchangeRequest.setId(10L);

        // A competing request from a third party
        User thirdParty = new User("Third Party", "third@example.com", "pass");
        thirdParty.setId(3L);
        ExchangeRequest competing = new ExchangeRequest(thirdParty, sender, requestedBook, null, ExchangeRequestStatus.PENDING);
        competing.setId(11L);

        when(userRepository.findByEmail("sender@example.com")).thenReturn(Optional.of(sender));
        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));
        when(exchangeRequestRepository.findByBookIdAndStatus(101L, ExchangeRequestStatus.PENDING))
                .thenReturn(List.of(exchangeRequest, competing));
        when(exchangeRequestRepository.save(any(ExchangeRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ExchangeRequestResponse response = exchangeRequestService.acceptRequest(10L);

        assertNotNull(response);
        assertEquals(ExchangeRequestStatus.ACCEPTED, response.getStatus());

        // Verify competing request was auto-rejected
        assertEquals(ExchangeRequestStatus.REJECTED, competing.getStatus());

        // Verify requested book owner became requester
        assertEquals(requester.getId(), requestedBook.getOwner().getId());
        verify(bookRepository, times(1)).save(requestedBook);

        // Verify offered book owner became sender
        assertEquals(sender.getId(), offeredBook.getOwner().getId());
        verify(bookRepository, times(1)).save(offeredBook);
    }

    @Test
    void testGetMyRequests_ReturnsOnlyUserParticipatingExchanges() {
        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));

        ExchangeRequest req1 = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.ACCEPTED);
        req1.setId(10L);

        when(exchangeRequestRepository.findByUserParticipantOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(req1));

        List<ExchangeRequestResponse> myRequests = exchangeRequestService.getMyRequests();

        assertNotNull(myRequests);
        assertEquals(1, myRequests.size());
        assertEquals(10L, myRequests.get(0).getId());
    }

    @Test
    void testAcceptRequest_Fails_WhenNotOwner() {
        // Authenticated as someone else
        User thirdParty = new User("Third Party", "third@example.com", "password");
        thirdParty.setId(3L);

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("third@example.com", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.PENDING);
        exchangeRequest.setId(10L);

        when(userRepository.findByEmail("third@example.com")).thenReturn(Optional.of(thirdParty));
        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));

        assertThrows(AccessDeniedException.class, () -> exchangeRequestService.acceptRequest(10L));
    }

    // ==========================================
    // RETURN WORKFLOW TESTS
    // ==========================================

    @Test
    void testRequestReturn_Success_ByOwner() {
        // Authenticated as sender (original owner)
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("sender@example.com", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.ACCEPTED);
        exchangeRequest.setId(10L);

        when(userRepository.findByEmail("sender@example.com")).thenReturn(Optional.of(sender));
        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));
        when(exchangeRequestRepository.save(any(ExchangeRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReturnRequestCreateDTO req = new ReturnRequestCreateDTO("Finished reading, requesting return please");
        ReturnDetailsResponseDTO result = exchangeRequestService.requestReturn(10L, req);

        assertNotNull(result);
        assertEquals(ExchangeRequestStatus.RETURN_REQUESTED, result.getStatus());
        assertEquals("Finished reading, requesting return please", result.getReturnMessage());
        assertNotNull(result.getReturnRequestedAt());

        verify(notificationService, times(1)).createNotification(
                eq(requester), eq("RETURN_REQUESTED"), anyString(), eq(10L)
        );
        verify(exchangeHistoryRepository, times(1)).save(any(ExchangeHistory.class));
    }

    @Test
    void testRequestReturn_Fails_WhenNotOriginalOwner() {
        // Authenticated as requester (current holder)
        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.ACCEPTED);
        exchangeRequest.setId(10L);

        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));

        assertThrows(AccessDeniedException.class, () -> exchangeRequestService.requestReturn(10L, null));
    }

    @Test
    void testAcceptReturn_Success_ByHolder() {
        // Authenticated as requester (current holder)
        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.RETURN_REQUESTED);
        exchangeRequest.setId(10L);

        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));
        when(exchangeRequestRepository.save(any(ExchangeRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReturnDetailsResponseDTO result = exchangeRequestService.acceptReturn(10L);

        assertNotNull(result);
        assertEquals(ExchangeRequestStatus.RETURN_IN_PROGRESS, result.getStatus());
        assertNotNull(result.getReturnAcceptedAt());

        verify(notificationService, times(1)).createNotification(
                eq(sender), eq("RETURN_ACCEPTED"), anyString(), eq(10L)
        );
        verify(exchangeHistoryRepository, times(1)).save(any(ExchangeHistory.class));
    }

    @Test
    void testDeclineReturn_Success_ByHolder() {
        // Authenticated as requester (current holder)
        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.RETURN_REQUESTED);
        exchangeRequest.setId(10L);

        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));
        when(exchangeRequestRepository.save(any(ExchangeRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReturnDetailsResponseDTO result = exchangeRequestService.declineReturn(10L, new ReturnRequestCreateDTO("Still reading, will return next week"));

        assertNotNull(result);
        assertEquals(ExchangeRequestStatus.RETURN_DECLINED, result.getStatus());
        assertNotNull(result.getReturnDeclinedAt());

        verify(notificationService, times(1)).createNotification(
                eq(sender), eq("RETURN_DECLINED"), anyString(), eq(10L)
        );
        verify(exchangeHistoryRepository, times(1)).save(any(ExchangeHistory.class));
    }

    // ==========================================
    // OTP VERIFICATION TESTS
    // ==========================================

    @Test
    void testGenerateReturnOtp_Success_ByOwner() {
        // Authenticated as sender (owner)
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("sender@example.com", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.RETURN_IN_PROGRESS);
        exchangeRequest.setId(10L);

        when(userRepository.findByEmail("sender@example.com")).thenReturn(Optional.of(sender));
        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hashedOtpExample");
        when(returnVerificationRepository.findFirstByExchangeRequestIdAndStatusOrderByCreatedAtDesc(10L, ReturnOtpStatus.ACTIVE))
                .thenReturn(Optional.empty());

        ReturnOtpGenerateResponseDTO result = exchangeRequestService.generateReturnOtp(10L);

        assertNotNull(result);
        assertEquals(10L, result.getExchangeRequestId());
        assertEquals(ReturnOtpStatus.ACTIVE, result.getStatus());
        assertNotNull(result.getOtp());
        assertTrue(result.getOtp().matches("^[0-9]{6}$"), "OTP must be exactly 6 digits");
        assertNotNull(result.getExpiresAt());

        // Verify entity saved with hash
        verify(returnVerificationRepository, times(1)).save(any(ReturnVerification.class));
        verify(notificationService, times(1)).createNotification(eq(requester), eq("RETURN_OTP_GENERATED"), anyString(), eq(10L));
        verify(exchangeHistoryRepository, times(1)).save(any(ExchangeHistory.class));
    }

    @Test
    void testGenerateReturnOtp_Fails_WhenNotOwner() {
        // Authenticated as requester (holder)
        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.RETURN_IN_PROGRESS);
        exchangeRequest.setId(10L);

        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));

        assertThrows(AccessDeniedException.class, () -> exchangeRequestService.generateReturnOtp(10L));
    }

    @Test
    void testVerifyReturnOtp_Success_ByHolder() {
        // Authenticated as requester (current holder)
        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.RETURN_IN_PROGRESS);
        exchangeRequest.setId(10L);

        ReturnVerification activeVerification = new ReturnVerification(
                exchangeRequest,
                "$2a$10$hashedOtpExample",
                LocalDateTime.now().plusMinutes(30),
                5
        );
        activeVerification.setId(100L);

        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));
        when(returnVerificationRepository.findFirstByExchangeRequestIdAndStatusOrderByCreatedAtDesc(10L, ReturnOtpStatus.ACTIVE))
                .thenReturn(Optional.of(activeVerification));
        when(passwordEncoder.matches("482913", "$2a$10$hashedOtpExample")).thenReturn(true);
        when(exchangeRequestRepository.save(any(ExchangeRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReturnDetailsResponseDTO result = exchangeRequestService.verifyReturnOtp(10L, new ReturnOtpVerifyRequestDTO("482913"));

        assertNotNull(result);
        assertEquals(ExchangeRequestStatus.RETURNED, result.getStatus());
        assertNotNull(result.getReturnedAt());
        assertEquals(ReturnOtpStatus.VERIFIED, activeVerification.getStatus());
        assertNotNull(activeVerification.getVerifiedAt());

        // Verify book ownership is NOT yet restored at this stage (still with requester)
        assertEquals(sender.getId(), exchangeRequest.getOwner().getId());

        verify(returnVerificationRepository, times(1)).save(activeVerification);
        verify(notificationService, times(1)).createNotification(eq(sender), eq("BOOK_RETURNED"), anyString(), eq(10L));
        verify(notificationService, times(1)).createNotification(eq(requester), eq("RETURN_OTP_VERIFIED"), anyString(), eq(10L));
        verify(exchangeHistoryRepository, times(2)).save(any(ExchangeHistory.class));
    }

    @Test
    void testVerifyReturnOtp_Fails_WhenInvalidOtp() {
        // Authenticated as requester (current holder)
        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.RETURN_IN_PROGRESS);
        exchangeRequest.setId(10L);

        ReturnVerification activeVerification = new ReturnVerification(
                exchangeRequest,
                "$2a$10$hashedOtpExample",
                LocalDateTime.now().plusMinutes(30),
                5
        );
        activeVerification.setAttemptCount(1);

        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));
        when(returnVerificationRepository.findFirstByExchangeRequestIdAndStatusOrderByCreatedAtDesc(10L, ReturnOtpStatus.ACTIVE))
                .thenReturn(Optional.of(activeVerification));
        when(passwordEncoder.matches("000000", "$2a$10$hashedOtpExample")).thenReturn(false);

        InvalidReturnOtpException ex = assertThrows(InvalidReturnOtpException.class, () ->
                exchangeRequestService.verifyReturnOtp(10L, new ReturnOtpVerifyRequestDTO("000000"))
        );

        assertTrue(ex.getMessage().contains("3 attempts remaining"));
        assertEquals(2, activeVerification.getAttemptCount());
        verify(returnVerificationRepository, times(1)).save(activeVerification);
    }

    @Test
    void testVerifyReturnOtp_Locks_After5FailedAttempts() {
        // Authenticated as requester (current holder)
        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.RETURN_IN_PROGRESS);
        exchangeRequest.setId(10L);

        ReturnVerification activeVerification = new ReturnVerification(
                exchangeRequest,
                "$2a$10$hashedOtpExample",
                LocalDateTime.now().plusMinutes(30),
                5
        );
        activeVerification.setAttemptCount(4); // 4 attempts already made

        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));
        when(returnVerificationRepository.findFirstByExchangeRequestIdAndStatusOrderByCreatedAtDesc(10L, ReturnOtpStatus.ACTIVE))
                .thenReturn(Optional.of(activeVerification));
        when(passwordEncoder.matches("000000", "$2a$10$hashedOtpExample")).thenReturn(false);

        ReturnOtpLockedException ex = assertThrows(ReturnOtpLockedException.class, () ->
                exchangeRequestService.verifyReturnOtp(10L, new ReturnOtpVerifyRequestDTO("000000"))
        );

        assertTrue(ex.getMessage().contains("locked"));
        assertEquals(5, activeVerification.getAttemptCount());
        assertEquals(ReturnOtpStatus.LOCKED, activeVerification.getStatus());
        verify(returnVerificationRepository, times(1)).save(activeVerification);
        verify(notificationService, times(1)).createNotification(eq(sender), eq("RETURN_OTP_LOCKED"), anyString(), eq(10L));
    }

    @Test
    void testVerifyReturnOtp_Fails_WhenExpired() {
        // Authenticated as requester (current holder)
        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.RETURN_IN_PROGRESS);
        exchangeRequest.setId(10L);

        ReturnVerification expiredVerification = new ReturnVerification(
                exchangeRequest,
                "$2a$10$hashedOtpExample",
                LocalDateTime.now().minusMinutes(5), // expired 5 mins ago
                5
        );

        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));
        when(returnVerificationRepository.findFirstByExchangeRequestIdAndStatusOrderByCreatedAtDesc(10L, ReturnOtpStatus.ACTIVE))
                .thenReturn(Optional.of(expiredVerification));

        assertThrows(ReturnOtpExpiredException.class, () ->
                exchangeRequestService.verifyReturnOtp(10L, new ReturnOtpVerifyRequestDTO("482913"))
        );

        assertEquals(ReturnOtpStatus.EXPIRED, expiredVerification.getStatus());
        verify(returnVerificationRepository, times(1)).save(expiredVerification);
    }

    @Test
    void testMarkReturned_Throws_ReturnOtpNotAllowedException() {
        assertThrows(ReturnOtpNotAllowedException.class, () -> exchangeRequestService.markReturned(10L));
    }

    @Test
    void testConfirmReceived_Success_RestoresOwnership() {
        // Authenticated as sender (original owner)
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("sender@example.com", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        requestedBook.setOwner(requester); // currently with requester
        offeredBook.setOwner(sender);      // currently with sender

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.RETURNED);
        exchangeRequest.setId(10L);

        when(userRepository.findByEmail("sender@example.com")).thenReturn(Optional.of(sender));
        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));
        when(exchangeRequestRepository.save(any(ExchangeRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReturnDetailsResponseDTO result = exchangeRequestService.confirmReceived(10L);

        assertNotNull(result);
        assertEquals(ExchangeRequestStatus.COMPLETED, result.getStatus());
        assertNotNull(result.getConfirmedAt());

        // Book ownership restored
        assertEquals(sender.getId(), requestedBook.getOwner().getId());
        assertEquals(requester.getId(), offeredBook.getOwner().getId());
        verify(bookRepository, times(1)).save(requestedBook);
        verify(bookRepository, times(1)).save(offeredBook);

        verify(notificationService, times(1)).createNotification(
                eq(requester), eq("RETURN_COMPLETED"), anyString(), eq(10L)
        );
        verify(notificationService, times(1)).createNotification(
                eq(sender), eq("RETURN_COMPLETED"), anyString(), eq(10L)
        );
        verify(exchangeHistoryRepository, times(2)).save(any(ExchangeHistory.class));
    }

    @Test
    void testGetExchangeHistory_Success() {
        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.COMPLETED);
        exchangeRequest.setId(10L);

        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));

        ExchangeHistory h1 = new ExchangeHistory(exchangeRequest, requester, ExchangeEventType.EXCHANGE_CREATED, "Created");
        h1.setId(1L);
        when(exchangeHistoryRepository.findByExchangeRequestIdOrderByCreatedAtAsc(10L))
                .thenReturn(List.of(h1));

        List<ExchangeHistoryResponseDTO> history = exchangeRequestService.getExchangeHistory(10L);

        assertNotNull(history);
        assertEquals(1, history.size());
        assertEquals(ExchangeEventType.EXCHANGE_CREATED, history.get(0).getEventType());
    }
}
