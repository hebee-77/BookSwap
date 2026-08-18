package com.hebee.bookswap.mapper;

import com.hebee.bookswap.dto.ExchangeRequestCreate;
import com.hebee.bookswap.dto.ExchangeRequestResponse;
import com.hebee.bookswap.entity.Book;
import com.hebee.bookswap.entity.ExchangeRequest;
import com.hebee.bookswap.entity.User;
import org.springframework.stereotype.Component;

@Component
public class ExchangeRequestMapper {

    public ExchangeRequest toEntity(ExchangeRequestCreate request, User requester, Book book) {
        if (request == null) {
            return null;
        }
        ExchangeRequest exchangeRequest = new ExchangeRequest();
        exchangeRequest.setRequester(requester);
        exchangeRequest.setBook(book);
        return exchangeRequest;
    }

    public ExchangeRequestResponse toResponse(ExchangeRequest exchangeRequest) {
        if (exchangeRequest == null) {
            return null;
        }
        ExchangeRequestResponse response = new ExchangeRequestResponse();
        response.setId(exchangeRequest.getId());
        if (exchangeRequest.getRequester() != null) {
            response.setRequesterId(exchangeRequest.getRequester().getId());
        }
        if (exchangeRequest.getBook() != null) {
            response.setBookId(exchangeRequest.getBook().getId());
        }
        response.setStatus(exchangeRequest.getStatus());
        response.setCreatedAt(exchangeRequest.getCreatedAt());
        return response;
    }
}
