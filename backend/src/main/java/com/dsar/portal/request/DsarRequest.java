package com.dsar.portal.request;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "dsar_request", indexes = {
        @Index(name = "idx_req_requester", columnList = "requesterId"),
        @Index(name = "idx_req_status", columnList = "status"),
        @Index(name = "idx_req_sla", columnList = "slaDueAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DsarRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID requesterId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DsarType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DsarStatus status;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String payloadJson;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String resultJson;

    @Column
    private UUID assignedAdminId;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column(nullable = false)
    private Instant slaDueAt;

    @Version
    private Long version;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
