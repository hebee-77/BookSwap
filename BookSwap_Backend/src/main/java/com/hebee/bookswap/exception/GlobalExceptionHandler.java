package com.hebee.bookswap.exception;

import com.hebee.bookswap.dto.ErrorResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ==========================================
    // 404 NOT FOUND EXCEPTIONS
    // ==========================================

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "NOT_FOUND",
                ex.getMessage() != null ? ex.getMessage() : "Requested resource was not found.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFoundException(EntityNotFoundException ex, HttpServletRequest request) {
        log.warn("Entity not found [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "NOT_FOUND",
                ex.getMessage() != null ? ex.getMessage() : "Requested entity was not found.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ReturnOtpNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleReturnOtpNotFoundException(ReturnOtpNotFoundException ex, HttpServletRequest request) {
        log.warn("Return OTP not found [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "NOT_FOUND",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler({NoHandlerFoundException.class, NoResourceFoundException.class})
    public ResponseEntity<ErrorResponse> handleNoResourceFoundException(Exception ex, HttpServletRequest request) {
        log.warn("No handler found [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "NOT_FOUND",
                "The requested endpoint does not exist: " + request.getRequestURI(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    // ==========================================
    // 400 BAD REQUEST & VALIDATION EXCEPTIONS
    // ==========================================

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequestException(BadRequestException ex, HttpServletRequest request) {
        log.warn("Bad request [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "BAD_REQUEST",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex, HttpServletRequest request) {
        log.warn("Illegal argument [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "BAD_REQUEST",
                ex.getMessage() != null ? ex.getMessage() : "Invalid request parameters provided.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ReturnRequestNotAllowedException.class)
    public ResponseEntity<ErrorResponse> handleReturnRequestNotAllowedException(ReturnRequestNotAllowedException ex, HttpServletRequest request) {
        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "BAD_REQUEST",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InvalidReturnOtpException.class)
    public ResponseEntity<ErrorResponse> handleInvalidReturnOtpException(InvalidReturnOtpException ex, HttpServletRequest request) {
        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "BAD_REQUEST",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ReturnOtpExpiredException.class)
    public ResponseEntity<ErrorResponse> handleReturnOtpExpiredException(ReturnOtpExpiredException ex, HttpServletRequest request) {
        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "BAD_REQUEST",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ReturnOtpNotAllowedException.class)
    public ResponseEntity<ErrorResponse> handleReturnOtpNotAllowedException(ReturnOtpNotAllowedException ex, HttpServletRequest request) {
        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "BAD_REQUEST",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        String firstErrorMessage = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("Validation failed. Please correct the highlighted fields.");

        log.warn("Validation error [path={}]: {}", request.getRequestURI(), errors);

        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                firstErrorMessage,
                request.getRequestURI(),
                errors
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolationException(ConstraintViolationException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            String property = violation.getPropertyPath() != null ? violation.getPropertyPath().toString() : "param";
            errors.put(property, violation.getMessage());
        }

        log.warn("Constraint violation [path={}]: {}", request.getRequestURI(), errors);

        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                "Validation failed for one or more parameters.",
                request.getRequestURI(),
                errors
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        log.warn("Malformed JSON payload [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "BAD_REQUEST",
                "Malformed request body or invalid data format. Please verify your input.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String requiredType = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown";
        String message = String.format("Invalid value '%s' for parameter '%s'. Expected format: %s.",
                ex.getValue(), ex.getName(), requiredType);
        log.warn("Type mismatch [path={}]: {}", request.getRequestURI(), message);
        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "BAD_REQUEST",
                message,
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingServletRequestParameter(MissingServletRequestParameterException ex, HttpServletRequest request) {
        String message = String.format("Required request parameter '%s' is missing.", ex.getParameterName());
        log.warn("Missing parameter [path={}]: {}", request.getRequestURI(), message);
        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "BAD_REQUEST",
                message,
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        log.warn("Max upload size exceeded [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "BAD_REQUEST",
                "File size exceeds the maximum allowed limit of 5 MB.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    // ==========================================
    // 401 UNAUTHORIZED EXCEPTIONS
    // ==========================================

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedException(UnauthorizedException ex, HttpServletRequest request) {
        log.warn("Unauthorized [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "UNAUTHORIZED",
                ex.getMessage() != null ? ex.getMessage() : "Authentication required. Please log in to continue.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(BadCredentialsException ex, HttpServletRequest request) {
        log.warn("Bad credentials [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "UNAUTHORIZED",
                "Invalid email or password.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(AuthenticationException ex, HttpServletRequest request) {
        log.warn("Authentication failed [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "UNAUTHORIZED",
                "Authentication required. Please log in to continue.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    // ==========================================
    // 403 FORBIDDEN EXCEPTIONS
    // ==========================================

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenException(ForbiddenException ex, HttpServletRequest request) {
        log.warn("Forbidden [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "FORBIDDEN",
                ex.getMessage() != null ? ex.getMessage() : "You do not have permission to perform this action.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access denied [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "FORBIDDEN",
                ex.getMessage() != null && !ex.getMessage().equalsIgnoreCase("Access is denied")
                        ? ex.getMessage()
                        : "You do not have permission to perform this action.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    // ==========================================
    // 405 METHOD NOT ALLOWED
    // ==========================================

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        log.warn("Method not allowed [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                "METHOD_NOT_ALLOWED",
                String.format("HTTP method '%s' is not supported for this endpoint.", ex.getMethod()),
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.METHOD_NOT_ALLOWED);
    }

    // ==========================================
    // 409 CONFLICT EXCEPTIONS
    // ==========================================

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflictException(ConflictException ex, HttpServletRequest request) {
        log.warn("Conflict [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                "CONFLICT",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(InvalidReturnStateException.class)
    public ResponseEntity<ErrorResponse> handleInvalidReturnStateException(InvalidReturnStateException ex, HttpServletRequest request) {
        log.warn("Invalid return state [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                "CONFLICT",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(ReturnOtpLockedException.class)
    public ResponseEntity<ErrorResponse> handleReturnOtpLockedException(ReturnOtpLockedException ex, HttpServletRequest request) {
        log.warn("Return OTP locked [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                "CONFLICT",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(IllegalStateException ex, HttpServletRequest request) {
        log.warn("Illegal state [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                "CONFLICT",
                ex.getMessage() != null ? ex.getMessage() : "The operation cannot be completed due to current entity state.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLockException(ObjectOptimisticLockingFailureException ex, HttpServletRequest request) {
        log.warn("Optimistic locking conflict [path={}]: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                "CONFLICT",
                "This exchange record was modified by another concurrent request. Please refresh and try again.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolationException(DataIntegrityViolationException ex, HttpServletRequest request) {
        // Detailed server-side log for developers (including root cause details)
        log.error("Database data integrity violation [path={}]: {}", request.getRequestURI(), ex.getMessage(), ex);

        String userFriendlyMessage = resolveDataIntegrityMessage(ex);

        ErrorResponse response = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                "CONFLICT",
                userFriendlyMessage,
                request.getRequestURI()
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    // ==========================================
    // 500 UNEXPECTED INTERNAL SERVER EXCEPTIONS
    // ==========================================

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<ErrorResponse> handleNullPointerException(NullPointerException ex, HttpServletRequest request) {
        String errorId = generateErrorId();
        log.error("Internal Server Error (NPE) [errorId={}, path={}]:", errorId, request.getRequestURI(), ex);

        ErrorResponse response = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "INTERNAL_SERVER_ERROR",
                "An unexpected server error occurred. Please try again later.",
                request.getRequestURI(),
                errorId
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, HttpServletRequest request) {
        String errorId = generateErrorId();
        log.error("Unhandled Exception [errorId={}, path={}]:", errorId, request.getRequestURI(), ex);

        ErrorResponse response = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "INTERNAL_SERVER_ERROR",
                "Something went wrong. Please try again later.",
                request.getRequestURI(),
                errorId
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private String generateErrorId() {
        return "ERR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String resolveDataIntegrityMessage(DataIntegrityViolationException ex) {
        String rootMsg = ex.getRootCause() != null ? ex.getRootCause().getMessage() : ex.getMessage();
        if (rootMsg == null) {
            return "This operation cannot be completed because it conflicts with existing records.";
        }

        String lower = rootMsg.toLowerCase();

        // Foreign key violations
        if (lower.contains("foreign key") || lower.contains("violates foreign key constraint")) {
            if (lower.contains("exchange") || lower.contains("reviews")) {
                return "This item cannot be deleted because it is associated with an existing exchange or review.";
            }
            if (lower.contains("conversations") || lower.contains("messages")) {
                return "This item cannot be deleted because it is associated with existing chat conversations.";
            }
            return "This item cannot be deleted because it is referenced by other active records.";
        }

        // Unique constraint violations
        if (lower.contains("unique constraint") || lower.contains("duplicate key") || lower.contains("already exists")) {
            if (lower.contains("email") || lower.contains("users_email")) {
                return "An account with this email address already exists.";
            }
            return "A record with this information already exists.";
        }

        // Not-null constraint violations
        if (lower.contains("violates not-null constraint") || lower.contains("null value in column")) {
            return "A required field was missing or invalid for this operation.";
        }

        return "This operation could not be completed due to a data conflict or database constraint.";
    }
}
