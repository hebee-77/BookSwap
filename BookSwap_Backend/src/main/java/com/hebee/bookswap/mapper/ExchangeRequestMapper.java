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
        return toEntity(request, requester, book != null ? book.getOwner() : null, book, null);
    }

    public ExchangeRequest toEntity(ExchangeRequestCreate request, User requester, User owner, Book book, Book offeredBook) {
        if (request == null) {
            return null;
        }
        ExchangeRequest exchangeRequest = new ExchangeRequest();
        exchangeRequest.setRequester(requester);
        exchangeRequest.setOwner(owner != null ? owner : (book != null ? book.getOwner() : null));
        exchangeRequest.setBook(book);
        exchangeRequest.setOfferedBook(offeredBook);
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
        if (exchangeRequest.getOwner() != null) {
            response.setOwnerId(exchangeRequest.getOwner().getId());
        } else if (exchangeRequest.getBook() != null && exchangeRequest.getBook().getOwner() != null) {
            response.setOwnerId(exchangeRequest.getBook().getOwner().getId());
        }
        if (exchangeRequest.getBook() != null) {
            response.setBookId(exchangeRequest.getBook().getId());
        }
        if (exchangeRequest.getOfferedBook() != null) {
            response.setOfferedBookId(exchangeRequest.getOfferedBook().getId());
        }
        response.setStatus(exchangeRequest.getStatus());
        response.setCreatedAt(exchangeRequest.getCreatedAt());
        return response;
    }
}
