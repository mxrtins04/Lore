package com.lore.app.repository;

import com.lore.app.entity.SmartBucket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface SmartBucketRepository extends JpaRepository<SmartBucket, UUID> {
}
