package com.hebee.bookswap.service;

import com.hebee.bookswap.dto.ExchangeRequestCreate;
import com.hebee.bookswap.dto.ExchangeRequestResponse;
import java.util.List;

public interface ExchangeRequestService {
    ExchangeRequestResponse createRequest(ExchangeRequestCreate request);
    ExchangeRequestResponse getRequestById(Long id);
    List<ExchangeRequestResponse> getAllRequests();
    List<ExchangeRequestResponse> getRequestsByRequester(Long requesterId);
    List<ExchangeRequestResponse> getRequestsByBook(Long bookId);
    ExchangeRequestResponse acceptRequest(Long id);
    ExchangeRequestResponse rejectRequest(Long id);
}
