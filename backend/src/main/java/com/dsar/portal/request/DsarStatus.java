package com.dsar.portal.request;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum DsarStatus {
    SUBMITTED,
    IN_REVIEW,
    APPROVED,
    REJECTED,
    COMPLETED;

    private static final Map<DsarStatus, Set<DsarStatus>> TRANSITIONS = Map.of(
            SUBMITTED,  EnumSet.of(IN_REVIEW, REJECTED),
            IN_REVIEW,  EnumSet.of(APPROVED, REJECTED),
            APPROVED,   EnumSet.of(COMPLETED),
            REJECTED,   EnumSet.noneOf(DsarStatus.class),
            COMPLETED,  EnumSet.noneOf(DsarStatus.class)
    );

    public boolean canTransitionTo(DsarStatus target) {
        return TRANSITIONS.getOrDefault(this, EnumSet.noneOf(DsarStatus.class)).contains(target);
    }

    public boolean isTerminal() {
        return this == COMPLETED || this == REJECTED;
    }
}
