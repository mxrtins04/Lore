package com.lore.app.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalContextResponse {
    private UUID id;
    private String content;
    private int version;
    private LocalDateTime updatedAt;
}
