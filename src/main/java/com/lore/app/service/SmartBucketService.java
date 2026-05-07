package com.lore.app.service;

import com.lore.app.dto.request.CreateSmartBucketRequest;
import com.lore.app.dto.request.UpdateSmartBucketRequest;
import com.lore.app.dto.response.ConversationResponse;
import com.lore.app.dto.response.SmartBucketResponse;
import com.lore.app.entity.Conversation;
import com.lore.app.entity.SmartBucket;
import com.lore.app.entity.SmartBucketCriteria;
import com.lore.app.exception.ResourceNotFoundException;
import com.lore.app.repository.ConversationRepository;
import com.lore.app.repository.SmartBucketRepository;
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
public class SmartBucketService {

    private final SmartBucketRepository smartBucketRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationService conversationService;

    public SmartBucketResponse createSmartBucket(CreateSmartBucketRequest request) {
        log.info("Creating smart bucket: {}", request.getName());
        SmartBucket bucket = SmartBucket.builder()
                .name(request.getName())
                .criteria(request.getCriteria())
                .build();
        return mapToResponse(smartBucketRepository.save(bucket));
    }

    public List<SmartBucketResponse> getAllSmartBuckets() {
        return smartBucketRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SmartBucketResponse getSmartBucketById(UUID id) {
        return smartBucketRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Smart bucket not found with id: " + id));
    }

    @Transactional
    public SmartBucketResponse updateSmartBucket(UUID id, UpdateSmartBucketRequest request) {
        SmartBucket bucket = smartBucketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Smart bucket not found with id: " + id));

        if (request.getName() != null) {
            bucket.setName(request.getName());
        }
        if (request.getCriteria() != null) {
            bucket.setCriteria(request.getCriteria());
        }

        return mapToResponse(smartBucketRepository.save(bucket));
    }

    public void deleteSmartBucket(UUID id) {
        if (!smartBucketRepository.existsById(id)) {
            throw new ResourceNotFoundException("Smart bucket not found with id: " + id);
        }
        smartBucketRepository.deleteById(id);
    }

    public List<ConversationResponse> resolveSmartBucket(UUID smartBucketId) {
        SmartBucket bucket = smartBucketRepository.findById(smartBucketId)
                .orElseThrow(() -> new ResourceNotFoundException("Smart bucket not found with id: " + smartBucketId));

        SmartBucketCriteria criteria = bucket.getCriteria();

        List<Conversation> matchingConversations = conversationRepository.findBySmartCriteria(
                criteria.getDateFrom(),
                criteria.getDateTo(),
                criteria.getPlatforms(),
                criteria.getBucketIds()
        );

        // Apply keywords filter manually if present (case-insensitive AND logic for title)
        if (criteria.getKeywords() != null && !criteria.getKeywords().isEmpty()) {
            matchingConversations = matchingConversations.stream()
                    .filter(c -> criteria.getKeywords().stream()
                            .anyMatch(keyword -> c.getTitle().toLowerCase().contains(keyword.toLowerCase())))
                    .collect(Collectors.toList());
        }

        return matchingConversations.stream()
                .map(conversationService::mapToResponse)
                .collect(Collectors.toList());
    }

    private SmartBucketResponse mapToResponse(SmartBucket bucket) {
        return SmartBucketResponse.builder()
                .id(bucket.getId())
                .name(bucket.getName())
                .criteria(bucket.getCriteria())
                .createdAt(bucket.getCreatedAt())
                .build();
    }
}
