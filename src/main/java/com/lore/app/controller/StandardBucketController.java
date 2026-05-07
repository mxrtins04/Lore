package com.lore.app.controller;

import com.lore.app.dto.request.CreateStandardBucketRequest;
import com.lore.app.dto.request.UpdateStandardBucketRequest;
import com.lore.app.dto.response.ConversationResponse;
import com.lore.app.dto.response.StandardBucketResponse;
import com.lore.app.service.ConversationService;
import com.lore.app.service.StandardBucketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/buckets/standard")
@RequiredArgsConstructor
public class StandardBucketController {

    private final StandardBucketService standardBucketService;
    private final ConversationService conversationService;

    @PostMapping
    public ResponseEntity<StandardBucketResponse> createBucket(@RequestBody CreateStandardBucketRequest request) {
        return ResponseEntity.ok(standardBucketService.createBucket(request));
    }

    @GetMapping
    public ResponseEntity<List<StandardBucketResponse>> getAllBuckets() {
        return ResponseEntity.ok(standardBucketService.getAllBuckets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StandardBucketResponse> getBucketById(@PathVariable UUID id) {
        return ResponseEntity.ok(standardBucketService.getBucketById(id));
    }

    @GetMapping("/{id}/conversations")
    public ResponseEntity<List<ConversationResponse>> getConversationsByBucket(@PathVariable UUID id) {
        return ResponseEntity.ok(conversationService.getConversationsByBucket(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StandardBucketResponse> updateBucket(@PathVariable UUID id, @RequestBody UpdateStandardBucketRequest request) {
        return ResponseEntity.ok(standardBucketService.updateBucket(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBucket(@PathVariable UUID id) {
        standardBucketService.deleteBucket(id);
        return ResponseEntity.noContent().build();
    }
}
