package com.hebee.bookswap.service;

import com.hebee.bookswap.dto.*;
import java.util.List;

public interface ExchangeRequestService {
    ExchangeRequestResponse createRequest(ExchangeRequestCreate request);
    ExchangeRequestResponse getRequestById(Long id);
    List<ExchangeRequestResponse> getAllRequests();
    List<ExchangeRequestResponse> getMyRequests();
    List<ExchangeRequestResponse> getRequestsByRequester(Long requesterId);
    List<ExchangeRequestResponse> getRequestsByBook(Long bookId);
    ExchangeRequestResponse acceptRequest(Long id);
    ExchangeRequestResponse rejectRequest(Long id);

    // Return lifecycle methods
    ReturnDetailsResponseDTO requestReturn(Long exchangeId, ReturnRequestCreateDTO request);
    ReturnDetailsResponseDTO acceptReturn(Long exchangeId);
    ReturnDetailsResponseDTO declineReturn(Long exchangeId, ReturnRequestCreateDTO request);
    ReturnOtpGenerateResponseDTO generateReturnOtp(Long exchangeId);
    ReturnDetailsResponseDTO verifyReturnOtp(Long exchangeId, ReturnOtpVerifyRequestDTO request);
    ReturnDetailsResponseDTO markReturned(Long exchangeId);
    ReturnDetailsResponseDTO confirmReceived(Long exchangeId);
    ReturnDetailsResponseDTO getReturnDetails(Long exchangeId);
    List<ExchangeHistoryResponseDTO> getExchangeHistory(Long exchangeId);
    void deleteExchange(Long exchangeId);
}
