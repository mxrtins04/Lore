package com.lore.app.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePersonalContextRequest {
    private String content;
}
