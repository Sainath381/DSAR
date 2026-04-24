package com.dsar.portal.audit;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class AuditSearchSpec {

    private AuditSearchSpec() {}

    public static Specification<AuditLog> of(String action,
                                             String entityType,
                                             String entityId,
                                             UUID actorId,
                                             Instant from,
                                             Instant to) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (entityType != null && !entityType.isBlank()) {
                predicates.add(cb.equal(root.get("entityType"), entityType));
            }
            if (entityId != null && !entityId.isBlank()) {
                predicates.add(cb.equal(root.get("entityId"), entityId));
            }
            if (actorId != null) {
                predicates.add(cb.equal(root.get("actorId"), actorId));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThan(root.get("timestamp"), to));
            }
            if (query != null) {
                query.orderBy(cb.desc(root.get("timestamp")));
            }
            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
