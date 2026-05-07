package com.lore.app.dto.request;

import com.lore.app.enums.PostPlatform;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratePostRequest {
    private PostPlatform postPlatform;
    private List<UUID> bucketIds;
    private List<String> bucketTypes;
    private boolean includePersonalContext;
}
