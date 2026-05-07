package com.lore.app.controller;

import com.lore.app.dto.request.CreateSmartBucketRequest;
import com.lore.app.dto.request.UpdateSmartBucketRequest;
import com.lore.app.dto.response.ConversationResponse;
import com.lore.app.dto.response.SmartBucketResponse;
import com.lore.app.service.SmartBucketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/buckets/smart")
@RequiredArgsConstructor
public class SmartBucketController {

    private final SmartBucketService smartBucketService;

    @PostMapping
    public ResponseEntity<SmartBucketResponse> createSmartBucket(@RequestBody CreateSmartBucketRequest request) {
        return ResponseEntity.ok(smartBucketService.createSmartBucket(request));
    }

    @GetMapping
    public ResponseEntity<List<SmartBucketResponse>> getAllSmartBuckets() {
        return ResponseEntity.ok(smartBucketService.getAllSmartBuckets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SmartBucketResponse> getSmartBucketById(@PathVariable UUID id) {
        return ResponseEntity.ok(smartBucketService.getSmartBucketById(id));
    }

    @GetMapping("/{id}/resolve")
    public ResponseEntity<List<ConversationResponse>> resolveSmartBucket(@PathVariable UUID id) {
        return ResponseEntity.ok(smartBucketService.resolveSmartBucket(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SmartBucketResponse> updateSmartBucket(@PathVariable UUID id, @RequestBody UpdateSmartBucketRequest request) {
        return ResponseEntity.ok(smartBucketService.updateSmartBucket(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSmartBucket(@PathVariable UUID id) {
        smartBucketService.deleteSmartBucket(id);
        return ResponseEntity.noContent().build();
    }
}
