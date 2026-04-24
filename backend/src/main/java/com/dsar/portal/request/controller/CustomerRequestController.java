package com.dsar.portal.request.controller;

import com.dsar.portal.request.RequestService;
import com.dsar.portal.request.dto.CreateRequestDto;
import com.dsar.portal.request.dto.RequestResponseDto;
import com.dsar.portal.security.AppUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/customer/requests")
@PreAuthorize("hasRole('CUSTOMER')")
@Tag(name = "Customer DSAR")
public class CustomerRequestController {

    private final RequestService service;

    public CustomerRequestController(RequestService service) {
        this.service = service;
    }

    @PostMapping
    @Operation(summary = "Submit a new DSAR request")
    public ResponseEntity<RequestResponseDto> submit(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @Valid @RequestBody CreateRequestDto body) {
        RequestResponseDto created = service.create(principal, body);
        return ResponseEntity.created(URI.create("/api/customer/requests/" + created.id())).body(created);
    }

    @GetMapping
    @Operation(summary = "List my DSAR requests")
    public List<RequestResponseDto> listMine(@AuthenticationPrincipal AppUserPrincipal principal) {
        return service.listMine(principal);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one of my DSAR requests")
    public RequestResponseDto getMine(@AuthenticationPrincipal AppUserPrincipal principal,
                                       @PathVariable UUID id) {
        return service.getMine(principal, id);
    }

    @GetMapping("/{id}/export")
    @Operation(summary = "Download the ACCESS export for my completed request")
    public ResponseEntity<Map<String, Object>> export(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID id) {
        Map<String, Object> body = service.getAccessExport(principal, id);
        String filename = "dsar-export-" + id + ".json";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .body(body);
    }
}
