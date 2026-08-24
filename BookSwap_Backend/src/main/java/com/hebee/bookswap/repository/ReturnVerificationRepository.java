package com.hebee.bookswap.repository;

import com.hebee.bookswap.constant.ReturnOtpStatus;
import com.hebee.bookswap.entity.ReturnVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReturnVerificationRepository extends JpaRepository<ReturnVerification, Long> {

    Optional<ReturnVerification> findFirstByExchangeRequestIdAndStatusOrderByCreatedAtDesc(
            Long exchangeRequestId, ReturnOtpStatus status
    );

    List<ReturnVerification> findByExchangeRequestIdAndStatus(
            Long exchangeRequestId, ReturnOtpStatus status
    );

    List<ReturnVerification> findByExchangeRequestIdOrderByCreatedAtDesc(
            Long exchangeRequestId
    );
}
