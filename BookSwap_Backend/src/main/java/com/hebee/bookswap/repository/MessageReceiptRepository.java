package com.hebee.bookswap.repository;

import com.hebee.bookswap.entity.MessageReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReceiptRepository extends JpaRepository<MessageReceipt, Long> {
    Optional<MessageReceipt> findByMessageIdAndUserId(Long messageId, Long userId);
    List<MessageReceipt> findByMessageId(Long messageId);
}
