package com.lore.app.dto.response;

import com.lore.app.entity.SmartBucketCriteria;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmartBucketResponse {
    private UUID id;
    private String name;
    private SmartBucketCriteria criteria;
    private LocalDateTime createdAt;
}
