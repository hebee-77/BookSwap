package com.hebee.bookswap.repository;

import com.hebee.bookswap.entity.MessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageAttachmentRepository extends JpaRepository<MessageAttachment, Long> {
    List<MessageAttachment> findByMessageId(Long messageId);
}
