package com.hebee.bookswap.exception;

import com.hebee.bookswap.dto.ErrorResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @Mock
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        when(request.getRequestURI()).thenReturn("/api/test");
    }

    @Test
    void handleResourceNotFoundException() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Book not found.");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleResourceNotFoundException(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertEquals(404, response.getBody().getStatus());
        assertEquals("NOT_FOUND", response.getBody().getError());
        assertEquals("Book not found.", response.getBody().getMessage());
        assertEquals("/api/test", response.getBody().getPath());
    }

    @Test
    void handleEntityNotFoundException() {
        EntityNotFoundException ex = new EntityNotFoundException("User not found.");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleEntityNotFoundException(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("User not found.", response.getBody().getMessage());
    }

    @Test
    void handleBadRequestException() {
        BadRequestException ex = new BadRequestException("Invalid input.");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleBadRequestException(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("BAD_REQUEST", response.getBody().getError());
        assertEquals("Invalid input.", response.getBody().getMessage());
    }

    @Test
    void handleIllegalArgumentException() {
        IllegalArgumentException ex = new IllegalArgumentException("Cannot exchange same book.");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleIllegalArgumentException(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Cannot exchange same book.", response.getBody().getMessage());
    }

    public void dummyMethod(String dummyParam) {}

    @Test
    void handleMethodArgumentNotValidException() throws NoSuchMethodException {
        Method method = getClass().getMethod("dummyMethod", String.class);
        MethodParameter parameter = new MethodParameter(method, 0);
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "target");
        bindingResult.addError(new FieldError("target", "title", "Title is required"));

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(parameter, bindingResult);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationException(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("VALIDATION_ERROR", response.getBody().getError());
        assertEquals("Title is required", response.getBody().getMessage());
        assertNotNull(response.getBody().getValidationErrors());
        assertEquals("Title is required", response.getBody().getValidationErrors().get("title"));
    }

    @Test
    void handleConstraintViolationException() {
        ConstraintViolationException ex = new ConstraintViolationException("Validation error", Set.of());
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleConstraintViolationException(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("VALIDATION_ERROR", response.getBody().getError());
    }

    @Test
    void handleHttpMessageNotReadable() {
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("JSON parse error");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleHttpMessageNotReadable(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().getMessage().contains("Malformed request body"));
    }

    @Test
    void handleMethodArgumentTypeMismatch() throws NoSuchMethodException {
        Method method = getClass().getMethod("dummyMethod", String.class);
        MethodParameter parameter = new MethodParameter(method, 0);
        MethodArgumentTypeMismatchException ex = new MethodArgumentTypeMismatchException("abc", Long.class, "id", parameter, null);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleMethodArgumentTypeMismatch(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().getMessage().contains("Invalid value 'abc' for parameter 'id'"));
    }

    @Test
    void handleMissingServletRequestParameter() {
        MissingServletRequestParameterException ex = new MissingServletRequestParameterException("page", "int");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleMissingServletRequestParameter(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Required request parameter 'page' is missing.", response.getBody().getMessage());
    }

    @Test
    void handleMaxUploadSizeExceeded() {
        MaxUploadSizeExceededException ex = new MaxUploadSizeExceededException(5242880);
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleMaxUploadSizeExceededException(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().getMessage().contains("5 MB"));
    }

    @Test
    void handleUnauthorizedException() {
        UnauthorizedException ex = new UnauthorizedException("Session expired.");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleUnauthorizedException(ex, request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("UNAUTHORIZED", response.getBody().getError());
        assertEquals("Session expired.", response.getBody().getMessage());
    }

    @Test
    void handleBadCredentialsException() {
        BadCredentialsException ex = new BadCredentialsException("Bad credentials");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleBadCredentialsException(ex, request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Invalid email or password.", response.getBody().getMessage());
    }

    @Test
    void handleAuthenticationException() {
        AuthenticationException ex = new AuthenticationException("Auth failed") {};
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleAuthenticationException(ex, request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Authentication required. Please log in to continue.", response.getBody().getMessage());
    }

    @Test
    void handleForbiddenException() {
        ForbiddenException ex = new ForbiddenException("You cannot delete this book.");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleForbiddenException(ex, request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("FORBIDDEN", response.getBody().getError());
        assertEquals("You cannot delete this book.", response.getBody().getMessage());
    }

    @Test
    void handleAccessDeniedException() {
        AccessDeniedException ex = new AccessDeniedException("Access is denied");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleAccessDeniedException(ex, request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("FORBIDDEN", response.getBody().getError());
        assertEquals("You do not have permission to perform this action.", response.getBody().getMessage());
    }

    @Test
    void handleHttpRequestMethodNotSupported() {
        HttpRequestMethodNotSupportedException ex = new HttpRequestMethodNotSupportedException("POST", List.of("GET"));
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleMethodNotSupported(ex, request);

        assertEquals(HttpStatus.METHOD_NOT_ALLOWED, response.getStatusCode());
        assertEquals("METHOD_NOT_ALLOWED", response.getBody().getError());
    }

    @Test
    void handleConflictException() {
        ConflictException ex = new ConflictException("Book already requested.");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleConflictException(ex, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("CONFLICT", response.getBody().getError());
        assertEquals("Book already requested.", response.getBody().getMessage());
    }

    @Test
    void handleOptimisticLockException() {
        ObjectOptimisticLockingFailureException ex = new ObjectOptimisticLockingFailureException("ExchangeRequest", 1L);
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleOptimisticLockException(ex, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertTrue(response.getBody().getMessage().contains("modified by another concurrent request"));
    }

    @Test
    void handleDataIntegrityViolationException_ForeignKey_SafeMessage() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "could not execute statement",
                new RuntimeException("update or delete on table exchange_requests violates foreign key constraint fk_review on table reviews")
        );
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleDataIntegrityViolationException(ex, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("CONFLICT", response.getBody().getError());
        assertEquals("This item cannot be deleted because it is associated with an existing exchange or review.", response.getBody().getMessage());
        assertFalse(response.getBody().getMessage().contains("fk_review"));
        assertFalse(response.getBody().getMessage().contains("could not execute statement"));
    }

    @Test
    void handleDataIntegrityViolationException_UniqueEmail_SafeMessage() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "could not execute statement",
                new RuntimeException("duplicate key value violates unique constraint users_email_key")
        );
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleDataIntegrityViolationException(ex, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("An account with this email address already exists.", response.getBody().getMessage());
        assertFalse(response.getBody().getMessage().contains("users_email_key"));
    }

    @Test
    void handleNullPointerException_ReturnsInternalServerError_WithCorrelationId() {
        NullPointerException ex = new NullPointerException("Null reference encountered");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleNullPointerException(ex, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("INTERNAL_SERVER_ERROR", response.getBody().getError());
        assertEquals("An unexpected server error occurred. Please try again later.", response.getBody().getMessage());
        assertNotNull(response.getBody().getErrorId());
        assertTrue(response.getBody().getErrorId().startsWith("ERR-"));
        assertFalse(response.getBody().getMessage().contains("Null reference encountered"));
    }

    @Test
    void handleGenericException_ReturnsInternalServerError_WithCorrelationId() {
        RuntimeException ex = new RuntimeException("Unexpected disk failure");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGenericException(ex, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("INTERNAL_SERVER_ERROR", response.getBody().getError());
        assertEquals("Something went wrong. Please try again later.", response.getBody().getMessage());
        assertNotNull(response.getBody().getErrorId());
        assertTrue(response.getBody().getErrorId().startsWith("ERR-"));
        assertFalse(response.getBody().getMessage().contains("Unexpected disk failure"));
    }
}
