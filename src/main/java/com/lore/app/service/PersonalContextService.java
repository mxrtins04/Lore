package com.lore.app.service;

import com.lore.app.dto.request.UpdatePersonalContextRequest;
import com.lore.app.dto.response.PersonalContextResponse;
import com.lore.app.entity.PersonalContext;
import com.lore.app.repository.PersonalContextRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class PersonalContextService {

    private final PersonalContextRepository personalContextRepository;

    public PersonalContextResponse getPersonalContext() {
        List<PersonalContext> contexts = personalContextRepository.findAll();
        if (contexts.isEmpty()) {
            return PersonalContextResponse.builder().build();
        }
        return mapToResponse(contexts.get(0));
    }

    @Transactional
    public PersonalContextResponse updatePersonalContext(UpdatePersonalContextRequest request) {
        log.info("Updating personal context");
        List<PersonalContext> contexts = personalContextRepository.findAll();
        PersonalContext context;
        
        if (contexts.isEmpty()) {
            context = PersonalContext.builder()
                    .content(request.getContent())
                    .version(1)
                    .build();
        } else {
            context = contexts.get(0);
            context.setContent(request.getContent());
            context.setVersion(context.getVersion() + 1);
        }

        return mapToResponse(personalContextRepository.save(context));
    }

    private PersonalContextResponse mapToResponse(PersonalContext context) {
        return PersonalContextResponse.builder()
                .id(context.getId())
                .content(context.getContent())
                .version(context.getVersion())
                .updatedAt(context.getUpdatedAt())
                .build();
    }
}
