package com.lore.app.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStandardBucketRequest {
    private String name;
    private String description;
}
