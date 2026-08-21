package com.hebee.bookswap.repository;

import com.hebee.bookswap.constant.MessageStatus;
import com.hebee.bookswap.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt DESC, m.id DESC")
    Page<Message> findByConversationIdOrderByCreatedAtDesc(@Param("conversationId") Long conversationId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt ASC, m.id ASC")
    List<Message> findByConversationIdOrderByCreatedAtAsc(@Param("conversationId") Long conversationId);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt DESC, m.id DESC LIMIT 1")
    Optional<Message> findLatestMessageByConversationId(@Param("conversationId") Long conversationId);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId AND (m.sender IS NULL OR m.sender.id != :userId) AND m.status != :readStatus")
    List<Message> findUnreadMessagesForUserInConversation(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId,
            @Param("readStatus") MessageStatus readStatus
    );

    @Modifying
    @Query("UPDATE Message m SET m.status = :status, m.updatedAt = CURRENT_TIMESTAMP WHERE m.conversation.id = :conversationId AND (m.sender IS NULL OR m.sender.id != :userId) AND m.status != 'READ'")
    int updateMessagesStatusForRecipient(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId,
            @Param("status") MessageStatus status
    );
}
