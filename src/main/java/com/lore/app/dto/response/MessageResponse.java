package com.lore.app.dto.response;

import com.lore.app.enums.MessageRole;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private UUID id;
    private MessageRole role;
    private String content;
    private LocalDateTime timestamp;
    private int orderIndex;
}
