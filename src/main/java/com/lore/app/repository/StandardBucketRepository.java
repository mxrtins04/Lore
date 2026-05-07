package com.lore.app.repository;

import com.lore.app.entity.StandardBucket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface StandardBucketRepository extends JpaRepository<StandardBucket, UUID> {
}
