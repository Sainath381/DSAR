package com.dsar.portal.request.dto;

import com.dsar.portal.request.DsarStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TransitionDto(
        @NotNull(message = "targetStatus is required") DsarStatus targetStatus,
        @Size(max = 1000, message = "note too long") String note
) {}
