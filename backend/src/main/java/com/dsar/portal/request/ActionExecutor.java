package com.dsar.portal.request;

import com.dsar.portal.audit.AuditLog;
import com.dsar.portal.audit.AuditLogRepository;
import com.dsar.portal.common.ApiException;
import com.dsar.portal.user.Role;
import com.dsar.portal.user.User;
import com.dsar.portal.user.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * Executes the side effect associated with a DSAR request when it is completed.
 * Returns a result map that becomes the public record of what was done (stored on the request
 * and shown to the customer if applicable).
 */
@Component
public class ActionExecutor {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final UserRepository users;
    private final DsarRequestRepository requests;
    private final AuditLogRepository audits;
    private final ObjectMapper mapper;

    public ActionExecutor(UserRepository users,
                          DsarRequestRepository requests,
                          AuditLogRepository audits,
                          ObjectMapper mapper) {
        this.users = users;
        this.requests = requests;
        this.audits = audits;
        this.mapper = mapper;
    }

    public Result execute(DsarRequest req) {
        return switch (req.getType()) {
            case ACCESS  -> executeAccess(req);
            case DELETE  -> executeDelete(req);
            case CORRECT -> executeCorrect(req);
        };
    }

    private Result executeAccess(DsarRequest req) {
        User user = requireUser(req.getRequesterId());

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId().toString());
        profile.put("email", user.getEmail());
        profile.put("fullName", user.getFullName());
        profile.put("role", user.getRole().name());
        profile.put("createdAt", user.getCreatedAt().toString());
        profile.put("deleted", user.isDeleted());

        List<Map<String, Object>> requestHistory = new ArrayList<>();
        for (DsarRequest r : requests.findByRequesterIdOrderByCreatedAtDesc(user.getId())) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", r.getId().toString());
            row.put("type", r.getType().name());
            row.put("status", r.getStatus().name());
            row.put("createdAt", r.getCreatedAt().toString());
            row.put("updatedAt", r.getUpdatedAt().toString());
            row.put("slaDueAt", r.getSlaDueAt().toString());
            requestHistory.add(row);
        }

        List<Map<String, Object>> auditHistory = new ArrayList<>();
        audits.findByEntityTypeAndEntityIdOrderByTimestampDesc(
                "User", user.getId().toString(), PageRequest.of(0, 50))
                .forEach(a -> auditHistory.add(summarize(a)));

        Map<String, Object> result = new HashMap<>();
        result.put("kind", "ACCESS_EXPORT");
        result.put("generatedAt", java.time.Instant.now().toString());
        result.put("profile", profile);
        result.put("requestHistory", requestHistory);
        result.put("auditHistory", auditHistory);

        return new Result(result, Map.of("kind", "ACCESS_EXPORT",
                "recordsExported", requestHistory.size() + auditHistory.size() + 1));
    }

    private Result executeDelete(DsarRequest req) {
        User user = requireUser(req.getRequesterId());
        if (user.getRole() != Role.CUSTOMER) {
            throw ApiException.badRequest("Only customer accounts may be deleted via DSAR");
        }
        if (user.isDeleted()) {
            throw ApiException.conflict("User is already anonymized");
        }

        Map<String, Object> before = Map.of(
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "deleted", user.isDeleted()
        );

        String redactedEmail = "deleted-" + user.getId() + "@anonymized.local";
        user.setEmail(redactedEmail);
        user.setFullName("REDACTED");
        user.setDeleted(true);
        users.save(user);

        Map<String, Object> after = Map.of(
                "email", redactedEmail,
                "fullName", "REDACTED",
                "deleted", true
        );

        Map<String, Object> result = Map.of(
                "kind", "USER_ANONYMIZED",
                "userId", user.getId().toString(),
                "before", before,
                "after", after
        );

        return new Result(result, result);
    }

    private Result executeCorrect(DsarRequest req) {
        User user = requireUser(req.getRequesterId());
        if (user.isDeleted()) {
            throw ApiException.conflict("Cannot correct an anonymized user");
        }

        Map<String, Object> payload = readPayload(req.getPayloadJson());
        Object field = payload.get("field");
        Object newValue = payload.get("newValue");
        if (!"fullName".equals(field) || !(newValue instanceof String ns) || ns.isBlank()) {
            throw ApiException.badRequest("Invalid CORRECT payload");
        }

        Map<String, Object> before = Map.of("fullName", user.getFullName());
        user.setFullName(ns.trim());
        users.save(user);
        Map<String, Object> after = Map.of("fullName", user.getFullName());

        Map<String, Object> result = Map.of(
                "kind", "USER_CORRECTED",
                "userId", user.getId().toString(),
                "field", "fullName",
                "before", before,
                "after", after
        );
        return new Result(result, result);
    }

    private User requireUser(UUID id) {
        return users.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> ApiException.notFound("Requester no longer exists"));
    }

    private Map<String, Object> readPayload(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try { return mapper.readValue(json, MAP_TYPE); }
        catch (Exception e) { throw ApiException.badRequest("Unreadable payload"); }
    }

    private Map<String, Object> summarize(AuditLog a) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", a.getId().toString());
        m.put("action", a.getAction());
        m.put("actorRole", a.getActorRole());
        m.put("timestamp", a.getTimestamp().toString());
        m.put("entityType", a.getEntityType());
        m.put("entityId", a.getEntityId());
        return m;
    }

    /**
     * @param publicResult what is stored on the request (shown to customer for ACCESS; still visible to admin otherwise)
     * @param auditPayload compact summary for the ACTION_EXECUTED audit row
     */
    public record Result(Map<String, Object> publicResult, Map<String, Object> auditPayload) {}
}
