package com.lore.app.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StandardBucketResponse {
    private UUID id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
}
