package com.lore.app.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStandardBucketRequest {
    private String name;
    private String description;
}
