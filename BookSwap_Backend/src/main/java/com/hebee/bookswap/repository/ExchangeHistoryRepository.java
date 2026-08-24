package com.hebee.bookswap.repository;

import com.hebee.bookswap.entity.ExchangeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExchangeHistoryRepository extends JpaRepository<ExchangeHistory, Long> {

    List<ExchangeHistory> findByExchangeRequestIdOrderByCreatedAtAsc(Long exchangeRequestId);

    List<ExchangeHistory> findByExchangeRequestIdOrderByCreatedAtDesc(Long exchangeRequestId);
}
