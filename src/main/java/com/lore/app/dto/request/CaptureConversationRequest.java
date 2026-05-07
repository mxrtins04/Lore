package com.lore.app.dto.request;

import com.lore.app.enums.Platform;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaptureConversationRequest {
    private Platform platform;
    private String platformConvoId;
    private String projectId;
    private String projectName;
    private String title;
    private List<MessageRequest> messages;
    private int inputTokens;
    private int outputTokens;
}
