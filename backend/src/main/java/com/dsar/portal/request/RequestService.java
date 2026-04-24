package com.dsar.portal.request;

import com.dsar.portal.audit.AuditAction;
import com.dsar.portal.audit.AuditService;
import com.dsar.portal.common.ApiException;
import com.dsar.portal.request.dto.CreateRequestDto;
import com.dsar.portal.request.dto.PagedResponse;
import com.dsar.portal.request.dto.RequestResponseDto;
import com.dsar.portal.request.dto.TransitionDto;
import com.dsar.portal.security.AppUserPrincipal;
import com.dsar.portal.user.User;
import com.dsar.portal.user.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
public class RequestService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final DsarRequestRepository requests;
    private final UserRepository users;
    private final ObjectMapper mapper;
    private final AuditService audit;
    private final ActionExecutor executor;
    private final int slaDays;

    public RequestService(DsarRequestRepository requests,
                          UserRepository users,
                          ObjectMapper mapper,
                          AuditService audit,
                          ActionExecutor executor,
                          @Value("${app.sla-days:30}") int slaDays) {
        this.requests = requests;
        this.users = users;
        this.mapper = mapper;
        this.audit = audit;
        this.executor = executor;
        this.slaDays = slaDays;
    }

    @Transactional
    public RequestResponseDto create(AppUserPrincipal requester, CreateRequestDto dto) {
        validatePayload(dto);

        Map<String, Object> payload = new HashMap<>();
        if (dto.note() != null && !dto.note().isBlank()) {
            payload.put("note", dto.note());
        }
        if (dto.payload() != null) {
            payload.putAll(dto.payload());
        }

        DsarRequest req = DsarRequest.builder()
                .requesterId(requester.getId())
                .type(dto.type())
                .status(DsarStatus.SUBMITTED)
                .payloadJson(writeJson(payload))
                .slaDueAt(Instant.now().plus(slaDays, ChronoUnit.DAYS))
                .build();
        req = requests.save(req);

        audit.record(requester.getId(), requester.getRole().name(),
                AuditAction.REQUEST_CREATED,
                "DsarRequest", req.getId().toString(),
                null,
                Map.of("type", req.getType().name(), "status", req.getStatus().name()));

        return toDto(req);
    }

    @Transactional(readOnly = true)
    public List<RequestResponseDto> listMine(AppUserPrincipal requester) {
        return requests.findByRequesterIdOrderByCreatedAtDesc(requester.getId())
                .stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public RequestResponseDto getMine(AppUserPrincipal requester, UUID id) {
        DsarRequest req = requests.findByIdAndRequesterId(id, requester.getId())
                .orElseThrow(() -> ApiException.notFound("Request not found"));
        return toDto(req);
    }

    @Transactional(readOnly = true)
    public PagedResponse<RequestResponseDto> adminSearch(DsarType type, DsarStatus status,
                                                          int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        Page<DsarRequest> result = requests.search(type, status, pageable);
        return PagedResponse.of(result, this::toDto);
    }

    @Transactional
    public RequestResponseDto adminGet(AppUserPrincipal admin, UUID id) {
        DsarRequest req = requests.findById(id)
                .orElseThrow(() -> ApiException.notFound("Request not found"));
        audit.record(admin.getId(), admin.getRole().name(),
                AuditAction.RECORD_ACCESSED,
                "DsarRequest", req.getId().toString(),
                null,
                Map.of("type", req.getType().name(), "status", req.getStatus().name()));
        return toDto(req);
    }

    @Transactional
    public RequestResponseDto transition(AppUserPrincipal admin, UUID id, TransitionDto dto) {
        Objects.requireNonNull(dto.targetStatus(), "targetStatus");

        DsarRequest req = requests.findById(id)
                .orElseThrow(() -> ApiException.notFound("Request not found"));

        DsarStatus current = req.getStatus();
        DsarStatus target = dto.targetStatus();

        if (target == DsarStatus.COMPLETED) {
            throw ApiException.badRequest(
                    "COMPLETED is reached via POST /api/admin/requests/{id}/complete, not transition");
        }
        if (current == target) {
            throw ApiException.badRequest("Request is already in status " + current);
        }
        if (!current.canTransitionTo(target)) {
            throw ApiException.conflict(
                    "Illegal transition: " + current + " -> " + target);
        }
        if (target == DsarStatus.REJECTED
                && (dto.note() == null || dto.note().isBlank())) {
            throw ApiException.badRequest(
                    "A justification note is required when rejecting a request");
        }

        Map<String, Object> before = Map.of("status", current.name());
        req.setStatus(target);
        if (target == DsarStatus.IN_REVIEW && req.getAssignedAdminId() == null) {
            req.setAssignedAdminId(admin.getId());
        }
        req = requests.save(req);

        Map<String, Object> after = new HashMap<>();
        after.put("status", target.name());
        if (dto.note() != null && !dto.note().isBlank()) {
            after.put("note", dto.note().trim());
        }

        audit.record(admin.getId(), admin.getRole().name(),
                AuditAction.STATUS_CHANGED,
                "DsarRequest", req.getId().toString(),
                before,
                after);

        return toDto(req);
    }

    @Transactional
    public RequestResponseDto complete(AppUserPrincipal admin, UUID id) {
        DsarRequest req = requests.findById(id)
                .orElseThrow(() -> ApiException.notFound("Request not found"));

        if (req.getStatus() != DsarStatus.APPROVED) {
            throw ApiException.conflict(
                    "Request must be APPROVED before completion (current: " + req.getStatus() + ")");
        }

        ActionExecutor.Result result = executor.execute(req);

        Map<String, Object> before = Map.of("status", req.getStatus().name());
        req.setStatus(DsarStatus.COMPLETED);
        req.setResultJson(writeJson(result.publicResult()));
        req = requests.save(req);

        Map<String, Object> after = Map.of("status", DsarStatus.COMPLETED.name());
        audit.record(admin.getId(), admin.getRole().name(),
                AuditAction.STATUS_CHANGED,
                "DsarRequest", req.getId().toString(),
                before, after);

        audit.record(admin.getId(), admin.getRole().name(),
                AuditAction.ACTION_EXECUTED,
                "DsarRequest", req.getId().toString(),
                null,
                result.auditPayload());

        return toDto(req);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAccessExport(AppUserPrincipal requester, UUID id) {
        DsarRequest req = requests.findByIdAndRequesterId(id, requester.getId())
                .orElseThrow(() -> ApiException.notFound("Request not found"));
        if (req.getType() != DsarType.ACCESS) {
            throw ApiException.badRequest("Only ACCESS requests have a data export");
        }
        if (req.getStatus() != DsarStatus.COMPLETED) {
            throw ApiException.conflict(
                    "Export is only available once the request is COMPLETED (current: "
                            + req.getStatus() + ")");
        }
        Map<String, Object> result = readJson(req.getResultJson());
        if (result == null) {
            throw ApiException.conflict("No export result is attached to this request");
        }
        return result;
    }

    private void validatePayload(CreateRequestDto dto) {
        Objects.requireNonNull(dto.type(), "type");
        Map<String, Object> payload = dto.payload() == null ? Map.of() : dto.payload();
        switch (dto.type()) {
            case CORRECT -> {
                Object field = payload.get("field");
                Object newValue = payload.get("newValue");
                if (!(field instanceof String fs) || fs.isBlank()) {
                    throw ApiException.badRequest("CORRECT requires payload.field (string)");
                }
                if (!"fullName".equals(fs)) {
                    throw ApiException.badRequest("Only fullName can be corrected in this POC");
                }
                if (!(newValue instanceof String ns) || ns.isBlank()) {
                    throw ApiException.badRequest("CORRECT requires payload.newValue (string)");
                }
            }
            case DELETE -> {
                Object confirmed = payload.get("confirmed");
                if (!Boolean.TRUE.equals(confirmed)) {
                    throw ApiException.badRequest("DELETE requires payload.confirmed=true");
                }
            }
            case ACCESS -> {}
        }
    }

    public RequestResponseDto toDto(DsarRequest r) {
        User user = users.findById(r.getRequesterId()).orElse(null);
        String email = user != null ? user.getEmail() : null;
        String name = user != null ? user.getFullName() : null;
        return RequestResponseDto.from(r, email, name,
                readJson(r.getPayloadJson()),
                readJson(r.getResultJson()));
    }

    private String writeJson(Object o) {
        if (o == null) return null;
        try {
            return mapper.writeValueAsString(o);
        } catch (JsonProcessingException e) {
            throw ApiException.badRequest("Could not serialize payload");
        }
    }

    private Map<String, Object> readJson(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return mapper.readValue(s, MAP_TYPE);
        } catch (Exception e) {
            return Map.of("_parseError", true);
        }
    }
}
