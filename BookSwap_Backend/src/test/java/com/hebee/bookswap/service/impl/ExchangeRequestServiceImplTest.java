package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.constant.BookCondition;
import com.hebee.bookswap.constant.ExchangeEventType;
import com.hebee.bookswap.constant.ExchangeRequestStatus;
import com.hebee.bookswap.dto.ExchangeHistoryResponseDTO;
import com.hebee.bookswap.dto.ExchangeRequestCreate;
import com.hebee.bookswap.dto.ExchangeRequestResponse;
import com.hebee.bookswap.dto.ReturnDetailsResponseDTO;
import com.hebee.bookswap.dto.ReturnRequestCreateDTO;
import com.hebee.bookswap.entity.Book;
import com.hebee.bookswap.entity.ExchangeHistory;
import com.hebee.bookswap.entity.ExchangeRequest;
import com.hebee.bookswap.entity.User;
import com.hebee.bookswap.exception.InvalidReturnStateException;
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
                chatService
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
    void testCreateRequest_Fails_WhenOfferingBookNotOwned() {
        ExchangeRequestCreate request = new ExchangeRequestCreate(101L, 202L);
        offeredBook.setOwner(sender); // not owned by requester

        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));
        when(bookRepository.findById(101L)).thenReturn(Optional.of(requestedBook));
        when(bookRepository.findById(202L)).thenReturn(Optional.of(offeredBook));

        assertThrows(IllegalArgumentException.class, () -> exchangeRequestService.createRequest(request));
    }

    @Test
    void testAcceptRequest_TransfersBothBooksOwnership() {
        // Authenticated as sender (owner of requestedBook)
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("sender@example.com", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.PENDING);
        exchangeRequest.setId(10L);

        when(userRepository.findByEmail("sender@example.com")).thenReturn(Optional.of(sender));
        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));
        when(exchangeRequestRepository.save(any(ExchangeRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ExchangeRequestResponse response = exchangeRequestService.acceptRequest(10L);

        assertNotNull(response);
        assertEquals(ExchangeRequestStatus.ACCEPTED, response.getStatus());

        // Verify requested book owner became requester
        assertEquals(requester.getId(), requestedBook.getOwner().getId());
        verify(bookRepository, times(1)).save(requestedBook);

        // Verify offered book owner became sender
        assertEquals(sender.getId(), offeredBook.getOwner().getId());
        verify(bookRepository, times(1)).save(offeredBook);

        // Verify notifications sent to both users
        verify(notificationService, times(1)).createNotification(
                eq(requester), eq("REQUEST_ACCEPTED"), anyString(), eq(10L)
        );
        verify(notificationService, times(1)).createNotification(
                eq(sender), eq("REQUEST_ACCEPTED"), anyString(), eq(10L)
        );
        verify(exchangeHistoryRepository, times(1)).save(any(ExchangeHistory.class));
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
    void testRequestReturn_Fails_WhenNotInAcceptedOrDeclinedState() {
        // Authenticated as sender (owner)
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("sender@example.com", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.PENDING);
        exchangeRequest.setId(10L);

        when(userRepository.findByEmail("sender@example.com")).thenReturn(Optional.of(sender));
        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));

        assertThrows(InvalidReturnStateException.class, () -> exchangeRequestService.requestReturn(10L, null));
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

    @Test
    void testMarkReturned_Success_ByHolder() {
        // Authenticated as requester (current holder)
        when(userRepository.findByEmail("requester@example.com")).thenReturn(Optional.of(requester));

        ExchangeRequest exchangeRequest = new ExchangeRequest(requester, sender, requestedBook, offeredBook, ExchangeRequestStatus.RETURN_IN_PROGRESS);
        exchangeRequest.setId(10L);

        when(exchangeRequestRepository.findById(10L)).thenReturn(Optional.of(exchangeRequest));
        when(exchangeRequestRepository.save(any(ExchangeRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReturnDetailsResponseDTO result = exchangeRequestService.markReturned(10L);

        assertNotNull(result);
        assertEquals(ExchangeRequestStatus.RETURNED, result.getStatus());
        assertNotNull(result.getReturnedAt());

        verify(notificationService, times(1)).createNotification(
                eq(sender), eq("BOOK_RETURNED"), anyString(), eq(10L)
        );
        verify(exchangeHistoryRepository, times(1)).save(any(ExchangeHistory.class));
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
