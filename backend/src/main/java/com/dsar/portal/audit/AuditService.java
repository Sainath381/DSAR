package com.dsar.portal.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository repo;
    private final ObjectMapper mapper;

    public AuditService(AuditLogRepository repo, ObjectMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    public void record(UUID actorId, String actorRole, String action,
                       String entityType, String entityId,
                       Object before, Object after) {
        AuditLog entry = AuditLog.builder()
                .actorId(actorId)
                .actorRole(actorRole)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .beforeJson(toJson(before))
                .afterJson(toJson(after))
                .ipAddress(resolveIp())
                .build();
        repo.save(entry);
    }

    private String toJson(Object o) {
        if (o == null) return null;
        try {
            return mapper.writeValueAsString(o);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize audit payload: {}", e.getMessage());
            return "{\"_serializationError\":true}";
        }
    }

    private String resolveIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            HttpServletRequest req = attrs.getRequest();
            String xff = req.getHeader("X-Forwarded-For");
            return xff != null && !xff.isBlank() ? xff.split(",")[0].trim() : req.getRemoteAddr();
        } catch (Exception e) {
            return null;
        }
    }
}
