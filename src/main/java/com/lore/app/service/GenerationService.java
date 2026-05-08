package com.lore.app.service;

import com.lore.app.dto.request.GeneratePostRequest;
import com.lore.app.dto.response.*;
import com.lore.app.entity.Generation;
import com.lore.app.enums.PostPlatform;
import com.lore.app.exception.ResourceNotFoundException;
import com.lore.app.repository.GenerationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class GenerationService {

    private final WebClient webClient;
    private final ConversationService conversationService;
    private final SmartBucketService smartBucketService;
    private final PersonalContextService personalContextService;
    private final GenerationRepository generationRepository;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Transactional
    public GenerationResponse generatePost(GeneratePostRequest request) {
        log.info("Using Gemini API key starting with: {}", geminiApiKey != null ? geminiApiKey.substring(0, 8) : "NULL");
        log.info("Generating post for platform: {}", request.getPostPlatform());

        // STEP 1 - COLLECT CONVERSATIONS
        Set<UUID> conversationIds = new HashSet<>();
        List<ConversationDetailResponse> selectedConversations = new ArrayList<>();

        for (int i = 0; i < request.getBucketIds().size(); i++) {
            UUID bucketId = request.getBucketIds().get(i);
            String bucketType = request.getBucketTypes().get(i);

            List<ConversationResponse> convos;
            if ("STANDARD".equalsIgnoreCase(bucketType)) {
                convos = conversationService.getConversationsByBucket(bucketId);
            } else if ("SMART".equalsIgnoreCase(bucketType)) {
                convos = smartBucketService.resolveSmartBucket(bucketId);
            } else {
                continue;
            }

            for (ConversationResponse convo : convos) {
                if (conversationIds.add(convo.getId())) {
                    selectedConversations.add(conversationService.getConversationById(convo.getId()));
                }
            }
        }

        if (selectedConversations.isEmpty()) {
            throw new IllegalArgumentException("No conversations found in selected buckets");
        }

        // STEP 2 - FETCH PERSONAL CONTEXT
        String personalContextSnapshot = null;
        if (request.isIncludePersonalContext()) {
            PersonalContextResponse context = personalContextService.getPersonalContext();
            personalContextSnapshot = context.getContent();
        }

        // STEP 3 - ASSEMBLE PROMPT
        String assembledPrompt = assemblePrompt(request.getPostPlatform(), personalContextSnapshot,
                selectedConversations);

        // STEP 4 - CALL GEMINI API
        Map<String, Object> geminiResponse = callGeminiApi(assembledPrompt);

        String output = parseOutput(geminiResponse);
        Map<String, Integer> tokenCounts = parseTokenCounts(geminiResponse);

        // STEP 5 - STORE AND RETURN
        Generation generation = Generation.builder()
                .postPlatform(request.getPostPlatform())
                .selectedBucketIds(request.getBucketIds())
                .selectedBucketTypes(request.getBucketTypes())
                .personalContextSnapshot(personalContextSnapshot)
                .assembledPrompt(assembledPrompt)
                .output(output)
                .modelUsed("gemini-2.0-flash")
                .inputTokens(tokenCounts.getOrDefault("input", 0))
                .outputTokens(tokenCounts.getOrDefault("output", 0))
                .build();

        return mapToResponse(generationRepository.save(generation));
    }

    public List<GenerationResponse> getAllGenerations() {
        return generationRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public GenerationDetailResponse getGenerationById(UUID id) {
        Generation generation = generationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Generation not found with id: " + id));
        return mapToDetailResponse(generation);
    }

    private String assemblePrompt(PostPlatform platform, String personalContext,
            List<ConversationDetailResponse> conversations) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are helping generate an authentic social media post.\n\n");

        if (personalContext != null && !personalContext.isBlank()) {
            sb.append("[PERSONAL CONTEXT]\n");
            sb.append(personalContext).append("\n\n");
        }

        sb.append("[LEARNING CONVERSATIONS]\n");
        sb.append(
                "The following are real conversations the user had while learning. Each conversation is labeled with its title and source platform.\n\n");

        for (ConversationDetailResponse convo : conversations) {
            sb.append("--- Conversation: ").append(convo.getTitle())
                    .append(" | Platform: ").append(convo.getPlatform()).append(" ---\n");
            for (MessageResponse msg : convo.getMessages()) {
                sb.append(msg.getRole()).append(": ").append(msg.getContent()).append("\n");
            }
            sb.append("\n");
        }

        sb.append("[TASK]\n");
        sb.append("Based on the conversations and personal context above, generate an authentic ")
                .append(platform).append(" post that captures the user's genuine learning journey.\n\n");

        if (platform == PostPlatform.X) {
            sb.append(
                    "For X: keep it under 280 characters unless a thread is more appropriate, in which case format as numbered tweets.\n\n");
        } else if (platform == PostPlatform.LINKEDIN) {
            sb.append(
                    "For LinkedIn: write in first person, conversational tone, no corporate buzzwords, focus on what was genuinely learned or built, can be longer form.\n\n");
        }

        sb.append("Output only the post content, nothing else.");
        return sb.toString();
    }

    private Map<String, Object> callGeminiApi(String prompt) {
    Map<String, Object> part = new HashMap<>();
    part.put("text", prompt);

    Map<String, Object> content = new HashMap<>();
    content.put("parts", List.of(part));

    Map<String, Object> requestBody = new HashMap<>();
    requestBody.put("contents", List.of(content));

    return webClient.post()
            .bodyValue(requestBody)
            .retrieve()
            .onStatus(status -> status.is4xxClientError(), response ->
                response.bodyToMono(String.class)
                    .doOnNext(body -> log.error("Gemini 4xx error body: {}", body))
                    .flatMap(body -> reactor.core.publisher.Mono.error(
                        new RuntimeException("Gemini API error: " + body)))
            )
            .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
            .block();
}

    @SuppressWarnings("unchecked")
    private String parseOutput(Map<String, Object> response) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            log.error("Error parsing Gemini API output", e);
            throw new RuntimeException("Failed to parse Gemini API response");
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Integer> parseTokenCounts(Map<String, Object> response) {
        Map<String, Integer> counts = new HashMap<>();
        try {
            Map<String, Object> usageMetadata = (Map<String, Object>) response.get("usageMetadata");
            counts.put("input", (Integer) usageMetadata.get("promptTokenCount"));
            counts.put("output", (Integer) usageMetadata.get("candidatesTokenCount"));
        } catch (Exception e) {
            log.warn("Could not parse token counts from Gemini response", e);
        }
        return counts;
    }

    private GenerationResponse mapToResponse(Generation g) {
        return GenerationResponse.builder()
                .id(g.getId())
                .postPlatform(g.getPostPlatform())
                .selectedBucketIds(g.getSelectedBucketIds())
                .selectedBucketTypes(g.getSelectedBucketTypes())
                .personalContextSnapshot(g.getPersonalContextSnapshot())
                .output(g.getOutput())
                .modelUsed(g.getModelUsed())
                .inputTokens(g.getInputTokens())
                .outputTokens(g.getOutputTokens())
                .createdAt(g.getCreatedAt())
                .build();
    }

    private GenerationDetailResponse mapToDetailResponse(Generation g) {
        return GenerationDetailResponse.builder()
                .id(g.getId())
                .postPlatform(g.getPostPlatform())
                .selectedBucketIds(g.getSelectedBucketIds())
                .selectedBucketTypes(g.getSelectedBucketTypes())
                .personalContextSnapshot(g.getPersonalContextSnapshot())
                .assembledPrompt(g.getAssembledPrompt())
                .output(g.getOutput())
                .modelUsed(g.getModelUsed())
                .inputTokens(g.getInputTokens())
                .outputTokens(g.getOutputTokens())
                .createdAt(g.getCreatedAt())
                .build();
    }
}
