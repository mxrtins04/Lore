package com.lore.app.repository;

import com.lore.app.entity.Conversation;
import com.lore.app.enums.Platform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    List<Conversation> findByStandardBucket_Id(UUID bucketId);
    Optional<Conversation> findByPlatformConvoId(String platformConvoId);
    List<Conversation> findByProjectId(String projectId);
    List<Conversation> findByCapturedAtBetween(LocalDateTime from, LocalDateTime to);
    List<Conversation> findByTitleContainingIgnoreCase(String keyword);
    List<Conversation> findByPlatformAndStandardBucket_Id(Platform platform, UUID bucketId);

    @Query("SELECT c FROM Conversation c WHERE " +
           "(:dateFrom IS NULL OR c.capturedAt >= :dateFrom) AND " +
           "(:dateTo IS NULL OR c.capturedAt <= :dateTo) AND " +
           "(:platforms IS NULL OR c.platform IN :platforms) AND " +
           "(:bucketIds IS NULL OR (c.standardBucket IS NOT NULL AND c.standardBucket.id IN :bucketIds))")
    List<Conversation> findBySmartCriteria(
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo,
            @Param("platforms") List<Platform> platforms,
            @Param("bucketIds") List<UUID> bucketIds);
}
