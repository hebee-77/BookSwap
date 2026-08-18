package com.hebee.bookswap.mapper;

import com.hebee.bookswap.dto.BookRequest;
import com.hebee.bookswap.dto.BookResponse;
import com.hebee.bookswap.entity.Book;
import com.hebee.bookswap.entity.User;
import org.springframework.stereotype.Component;

@Component
public class BookMapper {

    public Book toEntity(BookRequest request, User owner) {
        if (request == null) {
            return null;
        }
        Book book = new Book();
        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setIsbn(request.getIsbn());
        book.setDescription(request.getDescription());
        book.setBookCondition(request.getBookCondition());
        book.setOwner(owner);
        return book;
    }

    public BookResponse toResponse(Book book) {
        if (book == null) {
            return null;
        }
        BookResponse response = new BookResponse();
        response.setId(book.getId());
        response.setTitle(book.getTitle());
        response.setAuthor(book.getAuthor());
        response.setIsbn(book.getIsbn());
        response.setDescription(book.getDescription());
        response.setBookCondition(book.getBookCondition());
        if (book.getOwner() != null) {
            response.setOwnerId(book.getOwner().getId());
        }
        response.setCreatedAt(book.getCreatedAt());
        return response;
    }
}
