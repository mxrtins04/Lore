package com.lore.app.dto.request;

import com.lore.app.entity.SmartBucketCriteria;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSmartBucketRequest {
    private String name;
    private SmartBucketCriteria criteria;
}
