package com.hebee.bookswap.repository;

import com.hebee.bookswap.entity.ConversationParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, Long> {

    List<ConversationParticipant> findByConversationId(Long conversationId);

    Optional<ConversationParticipant> findByConversationIdAndUserId(Long conversationId, Long userId);

    @Query("SELECT cp FROM ConversationParticipant cp " +
           "WHERE cp.conversation.id = :conversationId AND cp.user.id != :userId")
    Optional<ConversationParticipant> findOtherParticipant(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM Message m " +
           "JOIN m.conversation c " +
           "JOIN c.participants cp " +
           "WHERE cp.user.id = :userId " +
           "AND (m.sender IS NULL OR m.sender.id != :userId) " +
           "AND m.deletedAt IS NULL " +
           "AND (cp.lastReadMessageId IS NULL OR m.id > cp.lastReadMessageId)")
    long countTotalUnreadMessagesForUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM Message m " +
           "JOIN m.conversation c " +
           "JOIN c.participants cp " +
           "WHERE c.id = :conversationId " +
           "AND cp.user.id = :userId " +
           "AND (m.sender IS NULL OR m.sender.id != :userId) " +
           "AND m.deletedAt IS NULL " +
           "AND (cp.lastReadMessageId IS NULL OR m.id > cp.lastReadMessageId)")
    long countUnreadMessagesForConversationAndUser(@Param("conversationId") Long conversationId, @Param("userId") Long userId);
}
