package com.lore.app.dto.response;

import com.lore.app.enums.Platform;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDetailResponse {
    private UUID id;
    private Platform platform;
    private String platformConvoId;
    private String projectId;
    private String projectName;
    private String title;
    private int inputTokens;
    private int outputTokens;
    private LocalDateTime capturedAt;
    private UUID bucketId;
    private List<MessageResponse> messages;
}
