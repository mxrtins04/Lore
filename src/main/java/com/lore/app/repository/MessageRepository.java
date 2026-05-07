package com.lore.app.repository;

import com.lore.app.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {
}
