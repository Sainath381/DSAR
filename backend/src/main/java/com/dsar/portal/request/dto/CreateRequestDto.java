package com.dsar.portal.request.dto;

import com.dsar.portal.request.DsarType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record CreateRequestDto(
        @NotNull(message = "type is required") DsarType type,
        @Size(max = 500, message = "note too long") String note,
        Map<String, Object> payload
) {}
