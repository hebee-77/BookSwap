package com.hebee.bookswap.controller;

import com.hebee.bookswap.dto.*;
import com.hebee.bookswap.service.ExchangeRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping({"/api/exchange-requests", "/api/exchanges"})
public class ExchangeRequestController {

    private final ExchangeRequestService exchangeRequestService;

    public ExchangeRequestController(ExchangeRequestService exchangeRequestService) {
        this.exchangeRequestService = exchangeRequestService;
    }

    @PostMapping
    public ResponseEntity<ExchangeRequestResponse> createRequest(@Valid @RequestBody ExchangeRequestCreate request) {
        ExchangeRequestResponse response = exchangeRequestService.createRequest(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExchangeRequestResponse> getRequestById(@PathVariable Long id) {
        ExchangeRequestResponse response = exchangeRequestService.getRequestById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<ExchangeRequestResponse>> getAllRequests() {
        List<ExchangeRequestResponse> response = exchangeRequestService.getAllRequests();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/requester/{requesterId}")
    public ResponseEntity<List<ExchangeRequestResponse>> getRequestsByRequester(@PathVariable Long requesterId) {
        List<ExchangeRequestResponse> response = exchangeRequestService.getRequestsByRequester(requesterId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/book/{bookId}")
    public ResponseEntity<List<ExchangeRequestResponse>> getRequestsByBook(@PathVariable Long bookId) {
        List<ExchangeRequestResponse> response = exchangeRequestService.getRequestsByBook(bookId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<ExchangeRequestResponse> acceptRequest(@PathVariable Long id) {
        ExchangeRequestResponse response = exchangeRequestService.acceptRequest(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ExchangeRequestResponse> rejectRequest(@PathVariable Long id) {
        ExchangeRequestResponse response = exchangeRequestService.rejectRequest(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // ==========================================
    // RETURN WORKFLOW ENDPOINTS
    // ==========================================

    @PostMapping("/{id}/return-request")
    public ResponseEntity<ReturnDetailsResponseDTO> requestReturn(
            @PathVariable Long id,
            @RequestBody(required = false) ReturnRequestCreateDTO request) {
        ReturnDetailsResponseDTO response = exchangeRequestService.requestReturn(id, request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/{id}/return-request/accept")
    public ResponseEntity<ReturnDetailsResponseDTO> acceptReturn(@PathVariable Long id) {
        ReturnDetailsResponseDTO response = exchangeRequestService.acceptReturn(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/{id}/return-request/decline")
    public ResponseEntity<ReturnDetailsResponseDTO> declineReturn(
            @PathVariable Long id,
            @RequestBody(required = false) ReturnRequestCreateDTO request) {
        ReturnDetailsResponseDTO response = exchangeRequestService.declineReturn(id, request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/{id}/return/otp/generate")
    public ResponseEntity<ReturnOtpGenerateResponseDTO> generateReturnOtp(@PathVariable Long id) {
        ReturnOtpGenerateResponseDTO response = exchangeRequestService.generateReturnOtp(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/{id}/return/otp/verify")
    public ResponseEntity<ReturnDetailsResponseDTO> verifyReturnOtp(
            @PathVariable Long id,
            @Valid @RequestBody ReturnOtpVerifyRequestDTO request) {
        ReturnDetailsResponseDTO response = exchangeRequestService.verifyReturnOtp(id, request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/{id}/return/mark-returned")
    public ResponseEntity<ReturnDetailsResponseDTO> markReturned(@PathVariable Long id) {
        ReturnDetailsResponseDTO response = exchangeRequestService.markReturned(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/{id}/return/confirm")
    public ResponseEntity<ReturnDetailsResponseDTO> confirmReceived(@PathVariable Long id) {
        ReturnDetailsResponseDTO response = exchangeRequestService.confirmReceived(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/{id}/return")
    public ResponseEntity<ReturnDetailsResponseDTO> getReturnDetails(@PathVariable Long id) {
        ReturnDetailsResponseDTO response = exchangeRequestService.getReturnDetails(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<ExchangeHistoryResponseDTO>> getExchangeHistory(@PathVariable Long id) {
        List<ExchangeHistoryResponseDTO> response = exchangeRequestService.getExchangeHistory(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
