package com.hebee.bookswap.service.impl;

import com.hebee.bookswap.constant.BookCondition;
import com.hebee.bookswap.constant.ExchangeRequestStatus;
import com.hebee.bookswap.dto.ExchangeRequestCreate;
import com.hebee.bookswap.dto.ExchangeRequestResponse;
import com.hebee.bookswap.entity.Book;
import com.hebee.bookswap.entity.ExchangeRequest;
import com.hebee.bookswap.entity.User;
import com.hebee.bookswap.mapper.ExchangeRequestMapper;
import com.hebee.bookswap.repository.BookRepository;
import com.hebee.bookswap.repository.ExchangeRequestRepository;
import com.hebee.bookswap.repository.UserRepository;
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
                notificationService
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
}
