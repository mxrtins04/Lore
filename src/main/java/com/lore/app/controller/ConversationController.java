package com.lore.app.controller;

import com.lore.app.dto.request.AssignBucketRequest;
import com.lore.app.dto.request.CaptureConversationRequest;
import com.lore.app.dto.response.ConversationDetailResponse;
import com.lore.app.dto.response.ConversationResponse;
import com.lore.app.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @PostMapping
    public ResponseEntity<ConversationResponse> captureConversation(@RequestBody CaptureConversationRequest request) {
        return ResponseEntity.ok(conversationService.captureConversation(request));
    }

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getAllConversations() {
        return ResponseEntity.ok(conversationService.getAllConversations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConversationDetailResponse> getConversationById(@PathVariable UUID id) {
        return ResponseEntity.ok(conversationService.getConversationById(id));
    }

    @PatchMapping("/{id}/bucket")
    public ResponseEntity<ConversationResponse> assignToBucket(@PathVariable UUID id, @RequestBody AssignBucketRequest request) {
        return ResponseEntity.ok(conversationService.assignToBucket(id, request.getBucketId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable UUID id) {
        conversationService.deleteConversation(id);
        return ResponseEntity.noContent().build();
    }
}
