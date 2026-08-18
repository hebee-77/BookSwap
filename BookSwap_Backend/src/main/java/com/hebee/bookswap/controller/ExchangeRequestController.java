package com.hebee.bookswap.controller;

import com.hebee.bookswap.dto.ExchangeRequestCreate;
import com.hebee.bookswap.dto.ExchangeRequestResponse;
import com.hebee.bookswap.service.ExchangeRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/exchange-requests")
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
}
