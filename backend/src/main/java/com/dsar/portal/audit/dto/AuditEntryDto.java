package com.dsar.portal.audit.dto;

import com.dsar.portal.audit.AuditLog;

import java.time.Instant;
import java.util.UUID;

public record AuditEntryDto(
        UUID id,
        UUID actorId,
        String actorRole,
        String action,
        String entityType,
        String entityId,
        String beforeJson,
        String afterJson,
        String ipAddress,
        Instant timestamp
) {
    public static AuditEntryDto from(AuditLog a) {
        return new AuditEntryDto(
                a.getId(),
                a.getActorId(),
                a.getActorRole(),
                a.getAction(),
                a.getEntityType(),
                a.getEntityId(),
                a.getBeforeJson(),
                a.getAfterJson(),
                a.getIpAddress(),
                a.getTimestamp()
        );
    }
}
