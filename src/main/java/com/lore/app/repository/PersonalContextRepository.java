package com.lore.app.repository;

import com.lore.app.entity.PersonalContext;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PersonalContextRepository extends JpaRepository<PersonalContext, UUID> {
}
