package com.lore.app.controller;

import com.lore.app.dto.request.UpdatePersonalContextRequest;
import com.lore.app.dto.response.PersonalContextResponse;
import com.lore.app.service.PersonalContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/context")
@RequiredArgsConstructor
public class PersonalContextController {

    private final PersonalContextService personalContextService;

    @GetMapping
    public ResponseEntity<PersonalContextResponse> getPersonalContext() {
        return ResponseEntity.ok(personalContextService.getPersonalContext());
    }

    @PutMapping
    public ResponseEntity<PersonalContextResponse> updatePersonalContext(@RequestBody UpdatePersonalContextRequest request) {
        return ResponseEntity.ok(personalContextService.updatePersonalContext(request));
    }
}
