package com.lore.app.controller;

import com.lore.app.dto.request.GeneratePostRequest;
import com.lore.app.dto.response.GenerationDetailResponse;
import com.lore.app.dto.response.GenerationResponse;
import com.lore.app.service.GenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/generations")
@RequiredArgsConstructor
public class GenerationController {

    private final GenerationService generationService;

    @PostMapping
    public ResponseEntity<GenerationResponse> generatePost(@RequestBody GeneratePostRequest request) {
        return ResponseEntity.ok(generationService.generatePost(request));
    }

    @GetMapping
    public ResponseEntity<List<GenerationResponse>> getAllGenerations() {
        return ResponseEntity.ok(generationService.getAllGenerations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GenerationDetailResponse> getGenerationById(@PathVariable UUID id) {
        return ResponseEntity.ok(generationService.getGenerationById(id));
    }
}
