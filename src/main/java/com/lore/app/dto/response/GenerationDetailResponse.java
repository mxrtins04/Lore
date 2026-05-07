package com.lore.app.dto.response;

import com.lore.app.enums.PostPlatform;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerationDetailResponse {
    private UUID id;
    private PostPlatform postPlatform;
    private List<UUID> selectedBucketIds;
    private List<String> selectedBucketTypes;
    private String personalContextSnapshot;
    private String assembledPrompt;
    private String output;
    private String modelUsed;
    private int inputTokens;
    private int outputTokens;
    private LocalDateTime createdAt;
}
