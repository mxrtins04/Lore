package com.lore.app.dto.request;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CvGenerationRequest {
    private List<UUID> bucketIds;
    private List<String> bucketTypes;
    private boolean includePersonalContext;
    private String githubUsername;

    public List<UUID> getBucketIds() {
        return bucketIds != null ? bucketIds : List.of();
    }

    public List<String> getBucketTypes() {
        return bucketTypes != null ? bucketTypes : List.of();
    }
}