package com.lore.app.dto.request;

import com.lore.app.enums.MessageRole;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {
    private MessageRole role;
    private String content;
    private LocalDateTime timestamp;
    private int orderIndex;
}
