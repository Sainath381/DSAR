package com.dsar.portal.request.controller;

import com.dsar.portal.request.DsarStatus;
import com.dsar.portal.request.DsarType;
import com.dsar.portal.request.RequestService;
import com.dsar.portal.request.dto.PagedResponse;
import com.dsar.portal.request.dto.RequestResponseDto;
import com.dsar.portal.request.dto.TransitionDto;
import com.dsar.portal.security.AppUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/requests")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin DSAR")
public class AdminRequestController {

    private final RequestService service;

    public AdminRequestController(RequestService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Search / list DSAR requests (filterable)")
    public PagedResponse<RequestResponseDto> search(
            @RequestParam(required = false) DsarType type,
            @RequestParam(required = false) DsarStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return service.adminSearch(type, status, page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Fetch a single DSAR request (also writes an audit record)")
    public RequestResponseDto get(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID id) {
        return service.adminGet(principal, id);
    }

    @PostMapping("/{id}/transition")
    @Operation(summary = "Transition the request through the state machine")
    public RequestResponseDto transition(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody TransitionDto body) {
        return service.transition(principal, id, body);
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Execute the approved action (ACCESS / DELETE / CORRECT) and mark COMPLETED")
    public RequestResponseDto complete(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID id) {
        return service.complete(principal, id);
    }
}
