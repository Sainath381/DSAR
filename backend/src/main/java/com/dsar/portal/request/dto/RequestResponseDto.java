package com.dsar.portal.request.dto;

import com.dsar.portal.request.DsarRequest;
import com.dsar.portal.request.DsarStatus;
import com.dsar.portal.request.DsarType;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record RequestResponseDto(
        UUID id,
        UUID requesterId,
        String requesterEmail,
        String requesterName,
        DsarType type,
        DsarStatus status,
        Map<String, Object> payload,
        Map<String, Object> result,
        UUID assignedAdminId,
        Instant createdAt,
        Instant updatedAt,
        Instant slaDueAt,
        long daysRemaining
) {
    public static RequestResponseDto from(DsarRequest r,
                                          String requesterEmail,
                                          String requesterName,
                                          Map<String, Object> payload,
                                          Map<String, Object> result) {
        long days = Duration.between(Instant.now(), r.getSlaDueAt()).toDays();
        return new RequestResponseDto(
                r.getId(),
                r.getRequesterId(),
                requesterEmail,
                requesterName,
                r.getType(),
                r.getStatus(),
                payload,
                result,
                r.getAssignedAdminId(),
                r.getCreatedAt(),
                r.getUpdatedAt(),
                r.getSlaDueAt(),
                days
        );
    }
}
