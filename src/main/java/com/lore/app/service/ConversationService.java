package com.lore.app.service;

import com.lore.app.dto.request.CaptureConversationRequest;
import com.lore.app.dto.response.ConversationDetailResponse;
import com.lore.app.dto.response.ConversationResponse;
import com.lore.app.dto.response.MessageResponse;
import com.lore.app.entity.Conversation;
import com.lore.app.entity.Message;
import com.lore.app.entity.StandardBucket;
import com.lore.app.exception.ResourceNotFoundException;
import com.lore.app.repository.ConversationRepository;
import com.lore.app.repository.StandardBucketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final StandardBucketRepository standardBucketRepository;

    @Transactional
    public ConversationResponse captureConversation(CaptureConversationRequest request) {
        log.info("Capturing conversation: {}", request.getTitle());
        
        if (request.getPlatformConvoId() != null) {
            conversationRepository.findByPlatformConvoId(request.getPlatformConvoId())
                    .ifPresent(c -> {
                        throw new IllegalArgumentException("Conversation with platform ID " + request.getPlatformConvoId() + " already exists.");
                    });
        }

        Conversation conversation = Conversation.builder()
                .platform(request.getPlatform())
                .platformConvoId(request.getPlatformConvoId())
                .projectId(request.getProjectId())
                .projectName(request.getProjectName())
                .title(request.getTitle())
                .inputTokens(request.getInputTokens())
                .outputTokens(request.getOutputTokens())
                .capturedAt(java.time.LocalDateTime.now())
                .build();

        request.getMessages().forEach(m -> {
            Message message = Message.builder()
                    .role(m.getRole())
                    .content(m.getContent())
                    .timestamp(m.getTimestamp())
                    .orderIndex(m.getOrderIndex())
                    .build();
            conversation.addMessage(message);
        });

        Conversation saved = conversationRepository.save(conversation);
        return mapToResponse(saved);
    }

    public List<ConversationResponse> getAllConversations() {
        return conversationRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ConversationDetailResponse getConversationById(UUID id) {
        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + id));
        
        return mapToDetailResponse(conversation);
    }

    @Transactional
    public ConversationResponse assignToBucket(UUID conversationId, UUID bucketId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));
        
        StandardBucket bucket = standardBucketRepository.findById(bucketId)
                .orElseThrow(() -> new ResourceNotFoundException("Standard bucket not found with id: " + bucketId));

        conversation.setStandardBucket(bucket);
        return mapToResponse(conversationRepository.save(conversation));
    }

    @Transactional
    public void deleteConversation(UUID id) {
        if (!conversationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Conversation not found with id: " + id);
        }
        conversationRepository.deleteById(id);
    }

    public List<ConversationResponse> getConversationsByBucket(UUID bucketId) {
        return conversationRepository.findByStandardBucket_Id(bucketId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ConversationResponse mapToResponse(Conversation conversation) {
        return ConversationResponse.builder()
                .id(conversation.getId())
                .platform(conversation.getPlatform())
                .platformConvoId(conversation.getPlatformConvoId())
                .projectId(conversation.getProjectId())
                .projectName(conversation.getProjectName())
                .title(conversation.getTitle())
                .inputTokens(conversation.getInputTokens())
                .outputTokens(conversation.getOutputTokens())
                .capturedAt(conversation.getCapturedAt())
                .build();
    }

    public ConversationDetailResponse mapToDetailResponse(Conversation conversation) {
        List<MessageResponse> messages = conversation.getMessages().stream()
                .map(this::mapMessageToResponse)
                .collect(Collectors.toList());

        return ConversationDetailResponse.builder()
                .id(conversation.getId())
                .platform(conversation.getPlatform())
                .platformConvoId(conversation.getPlatformConvoId())
                .projectId(conversation.getProjectId())
                .projectName(conversation.getProjectName())
                .title(conversation.getTitle())
                .inputTokens(conversation.getInputTokens())
                .outputTokens(conversation.getOutputTokens())
                .capturedAt(conversation.getCapturedAt())
                .bucketId(conversation.getStandardBucket() != null ? conversation.getStandardBucket().getId() : null)
                .messages(messages)
                .build();
    }

    private MessageResponse mapMessageToResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .role(message.getRole())
                .content(message.getContent())
                .timestamp(message.getTimestamp())
                .orderIndex(message.getOrderIndex())
                .build();
    }
}
