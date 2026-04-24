package com.dsar.portal.audit;

import com.dsar.portal.audit.dto.AuditEntryDto;
import com.dsar.portal.request.dto.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/audit")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Audit")
public class AuditController {

    private final AuditLogRepository repo;

    public AuditController(AuditLogRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    @Operation(summary = "Search the audit log (admin only, append-only)")
    public PagedResponse<AuditEntryDto> search(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) UUID actorId,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 200));
        Page<AuditLog> result = repo.findAll(
                AuditSearchSpec.of(action, entityType, entityId, actorId, from, to),
                pageable);
        return PagedResponse.of(result, AuditEntryDto::from);
    }
}
