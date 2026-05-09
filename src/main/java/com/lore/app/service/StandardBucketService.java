package com.lore.app.service;

import com.lore.app.dto.request.CreateStandardBucketRequest;
import com.lore.app.dto.request.UpdateStandardBucketRequest;
import com.lore.app.dto.response.StandardBucketResponse;
import com.lore.app.entity.Conversation;
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
public class StandardBucketService {

    private final StandardBucketRepository standardBucketRepository;
    private final ConversationRepository conversationRepository;

    public StandardBucketResponse createBucket(CreateStandardBucketRequest request) {
        log.info("Creating standard bucket: {}", request.getName());
        StandardBucket bucket = StandardBucket.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();
        return mapToResponse(standardBucketRepository.save(bucket));
    }

    public List<StandardBucketResponse> getAllBuckets() {
        return standardBucketRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public StandardBucketResponse getBucketById(UUID id) {
        return standardBucketRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Standard bucket not found with id: " + id));
    }

    @Transactional
    public StandardBucketResponse updateBucket(UUID id, UpdateStandardBucketRequest request) {
        StandardBucket bucket = standardBucketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Standard bucket not found with id: " + id));

        if (request.getName() != null) {
            bucket.setName(request.getName());
        }
        if (request.getDescription() != null) {
            bucket.setDescription(request.getDescription());
        }

        return mapToResponse(standardBucketRepository.save(bucket));
    }

    @Transactional
    public void deleteBucket(UUID id) {
        StandardBucket bucket = standardBucketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Standard bucket not found with id: " + id));

        // Before deleting, set bucket_id to null for all conversations in this bucket
        List<Conversation> conversations = conversationRepository.findByStandardBucket_Id(id);
        conversations.forEach(c -> c.setStandardBucket(null));
        conversationRepository.saveAll(conversations);

        standardBucketRepository.delete(bucket);
    }

    private StandardBucketResponse mapToResponse(StandardBucket bucket) {
        Integer conversationCount = conversationRepository.countByStandardBucket_Id(bucket.getId());
        return StandardBucketResponse.builder()
                .id(bucket.getId())
                .name(bucket.getName())
                .description(bucket.getDescription())
                .createdAt(bucket.getCreatedAt())
                .conversationCount(conversationCount)
                .build();
    }
}
