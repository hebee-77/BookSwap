package com.hebee.bookswap.repository;

import com.hebee.bookswap.constant.ExchangeRequestStatus;
import com.hebee.bookswap.entity.ExchangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;

@Repository
public interface ExchangeRequestRepository extends JpaRepository<ExchangeRequest, Long> {

    List<ExchangeRequest> findByRequesterId(Long requesterId);

    List<ExchangeRequest> findByOwnerId(Long ownerId);

    List<ExchangeRequest> findByBookId(Long bookId);

    List<ExchangeRequest> findByOfferedBookId(Long offeredBookId);

    @Query("SELECT e FROM ExchangeRequest e WHERE e.owner.id = :userId OR e.requester.id = :userId ORDER BY e.createdAt DESC")
    List<ExchangeRequest> findByUserParticipantOrderByCreatedAtDesc(@Param("userId") Long userId);

    List<ExchangeRequest> findByBookIdAndStatus(Long bookId, ExchangeRequestStatus status);

    List<ExchangeRequest> findByOfferedBookIdAndStatus(Long offeredBookId, ExchangeRequestStatus status);

    boolean existsByRequesterIdAndBookIdAndStatus(Long requesterId, Long bookId, ExchangeRequestStatus status);

    boolean existsByRequesterIdAndBookIdAndStatusIn(Long requesterId, Long bookId, Collection<ExchangeRequestStatus> statuses);

    boolean existsByBookIdAndStatus(Long bookId, ExchangeRequestStatus status);

    boolean existsByBookIdAndStatusIn(Long bookId, Collection<ExchangeRequestStatus> statuses);

    boolean existsByOfferedBookIdAndStatus(Long offeredBookId, ExchangeRequestStatus status);

    boolean existsByOfferedBookIdAndStatusIn(Long offeredBookId, Collection<ExchangeRequestStatus> statuses);
}
