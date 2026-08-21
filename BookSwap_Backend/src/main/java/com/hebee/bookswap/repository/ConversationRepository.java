package com.hebee.bookswap.repository;

import com.hebee.bookswap.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("SELECT DISTINCT c FROM Conversation c " +
           "JOIN c.participants cp " +
           "WHERE cp.user.id = :userId " +
           "ORDER BY c.updatedAt DESC")
    List<Conversation> findByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM Conversation c " +
           "JOIN c.participants cp1 " +
           "JOIN c.participants cp2 " +
           "WHERE cp1.user.id = :user1Id AND cp2.user.id = :user2Id AND cp1.id != cp2.id")
    List<Conversation> findConversationsBetweenUsers(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);

    @Query("SELECT CASE WHEN COUNT(cp) > 0 THEN true ELSE false END FROM ConversationParticipant cp " +
           "WHERE cp.conversation.id = :conversationId AND cp.user.id = :userId")
    boolean isUserParticipant(@Param("conversationId") Long conversationId, @Param("userId") Long userId);
}
