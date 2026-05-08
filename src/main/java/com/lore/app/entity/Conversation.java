package com.lore.app.entity;

import com.lore.app.enums.Platform;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Platform platform;

    @Column(name = "platform_convo_id")
    private String platformConvoId;

    @Column(name = "project_id")
    private String projectId;

    @Column(name = "project_name")
    private String projectName;

    @Column(nullable = false)
    private String title;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<Message> messages = new ArrayList<>();

    @Column(name = "input_tokens", nullable = false)
    @Builder.Default
    private int inputTokens = 0;

    @Column(name = "output_tokens", nullable = false)
    @Builder.Default
    private int outputTokens = 0;

    @Column(name = "captured_at", nullable = false, updatable = false)
    private LocalDateTime capturedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bucket_id", insertable = false, updatable = false)
    private StandardBucket standardBucket;

    @Column(name = "bucket_id")
    private UUID bucketId;

    public void addMessage(Message message) {
        messages.add(message);
        message.setConversation(this);
    }
}
