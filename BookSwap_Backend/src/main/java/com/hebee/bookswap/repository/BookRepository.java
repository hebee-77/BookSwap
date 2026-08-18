package com.hebee.bookswap.repository;

import com.hebee.bookswap.constant.BookCondition;
import com.hebee.bookswap.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    Page<Book> findByOwnerId(Long ownerId, Pageable pageable);

    Page<Book> findByBookCondition(BookCondition bookCondition, Pageable pageable);

    @Query("SELECT b FROM Book b WHERE (LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(b.author) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND (:condition IS NULL OR b.bookCondition = :condition)")
    Page<Book> searchBooksCombined(@Param("keyword") String keyword, @Param("condition") BookCondition condition, Pageable pageable);
}
