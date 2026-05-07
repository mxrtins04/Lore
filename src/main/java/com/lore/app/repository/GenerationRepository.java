package com.lore.app.repository;

import com.lore.app.entity.Generation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface GenerationRepository extends JpaRepository<Generation, UUID> {
}
