package com.hebee.bookswap.repository;

import com.hebee.bookswap.constant.ExchangeRequestStatus;
import com.hebee.bookswap.entity.ExchangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExchangeRequestRepository extends JpaRepository<ExchangeRequest, Long> {

    List<ExchangeRequest> findByRequesterId(Long requesterId);

    List<ExchangeRequest> findByOwnerId(Long ownerId);

    List<ExchangeRequest> findByBookId(Long bookId);

    List<ExchangeRequest> findByOfferedBookId(Long offeredBookId);

    boolean existsByRequesterIdAndBookIdAndStatus(Long requesterId, Long bookId, ExchangeRequestStatus status);

    boolean existsByBookIdAndStatus(Long bookId, ExchangeRequestStatus status);

    boolean existsByOfferedBookIdAndStatus(Long offeredBookId, ExchangeRequestStatus status);
}
