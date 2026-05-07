package com.lore.app.entity;

import com.lore.app.enums.Platform;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmartBucketCriteria {
    private LocalDateTime dateFrom;
    private LocalDateTime dateTo;
    private List<Platform> platforms;
    private List<UUID> bucketIds;
    private List<String> keywords;
}
