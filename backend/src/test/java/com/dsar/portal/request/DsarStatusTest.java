package com.dsar.portal.request;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pure unit tests on the state machine — no Spring context needed.
 * Encodes the legal transition graph:
 *   SUBMITTED → IN_REVIEW | REJECTED
 *   IN_REVIEW → APPROVED  | REJECTED
 *   APPROVED  → COMPLETED
 *   REJECTED, COMPLETED   → terminal
 */
class DsarStatusTest {

    @ParameterizedTest(name = "[{index}] {0} → {1} should be legal")
    @CsvSource({
            "SUBMITTED, IN_REVIEW",
            "SUBMITTED, REJECTED",
            "IN_REVIEW, APPROVED",
            "IN_REVIEW, REJECTED",
            "APPROVED,  COMPLETED"
    })
    @DisplayName("legal transitions are allowed")
    void legal(DsarStatus from, DsarStatus to) {
        assertThat(from.canTransitionTo(to)).isTrue();
    }

    @ParameterizedTest(name = "[{index}] {0} → {1} should be illegal")
    @CsvSource({
            "SUBMITTED, APPROVED",
            "SUBMITTED, COMPLETED",
            "SUBMITTED, SUBMITTED",
            "IN_REVIEW, SUBMITTED",
            "IN_REVIEW, COMPLETED",
            "APPROVED,  SUBMITTED",
            "APPROVED,  IN_REVIEW",
            "APPROVED,  REJECTED",
            "REJECTED,  SUBMITTED",
            "REJECTED,  IN_REVIEW",
            "REJECTED,  APPROVED",
            "REJECTED,  COMPLETED",
            "COMPLETED, SUBMITTED",
            "COMPLETED, IN_REVIEW",
            "COMPLETED, APPROVED",
            "COMPLETED, REJECTED"
    })
    @DisplayName("illegal transitions are rejected")
    void illegal(DsarStatus from, DsarStatus to) {
        assertThat(from.canTransitionTo(to)).isFalse();
    }

    @ParameterizedTest
    @CsvSource({
            "REJECTED,  true",
            "COMPLETED, true",
            "SUBMITTED, false",
            "IN_REVIEW, false",
            "APPROVED,  false"
    })
    @DisplayName("terminal status reported correctly")
    void terminal(DsarStatus s, boolean terminal) {
        assertThat(s.isTerminal()).isEqualTo(terminal);
    }
}
