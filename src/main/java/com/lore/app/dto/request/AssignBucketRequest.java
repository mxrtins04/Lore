package com.lore.app.dto.request;

import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignBucketRequest {
    private UUID bucketId;
}
