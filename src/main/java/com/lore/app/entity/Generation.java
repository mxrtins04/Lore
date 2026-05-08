package com.lore.app.entity;

import com.lore.app.enums.PostPlatform;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "generations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Generation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_platform", nullable = false)
    private PostPlatform postPlatform;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "selected_bucket_ids", columnDefinition = "jsonb")
    private List<UUID> selectedBucketIds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "selected_bucket_types", columnDefinition = "jsonb")
    private List<String> selectedBucketTypes;

    @Column(name = "personal_context_snapshot", columnDefinition = "TEXT")
    private String personalContextSnapshot;

    @Column(name = "assembled_prompt", columnDefinition = "TEXT", nullable = false)
    private String assembledPrompt;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String output;

    @Column(name = "model_used", nullable = false)
    private String modelUsed;

    @Column(name = "input_tokens", nullable = false)
    private int inputTokens;

    @Column(name = "output_tokens", nullable = false)
    private int outputTokens;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
