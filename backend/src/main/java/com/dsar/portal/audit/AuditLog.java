package com.dsar.portal.audit;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

import java.time.Instant;
import java.util.UUID;

/**
 * Append-only audit record. No update or delete path exists in the codebase.
 */
@Entity
@Table(name = "audit_log", indexes = {
        @Index(name = "idx_audit_entity", columnList = "entityType,entityId"),
        @Index(name = "idx_audit_actor", columnList = "actorId"),
        @Index(name = "idx_audit_action", columnList = "action"),
        @Index(name = "idx_audit_time", columnList = "timestamp")
})
@Immutable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(length = 64)
    private UUID actorId;

    @Column(length = 32)
    private String actorRole;

    @Column(nullable = false, length = 64)
    private String action;

    @Column(length = 64)
    private String entityType;

    @Column(length = 64)
    private String entityId;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String beforeJson;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String afterJson;

    @Column(length = 64)
    private String ipAddress;

    @Column(nullable = false)
    private Instant timestamp;

    @PrePersist
    void onCreate() {
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }
}
