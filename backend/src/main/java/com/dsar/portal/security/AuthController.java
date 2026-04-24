package com.dsar.portal.security;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth")
public class AuthController {

    @GetMapping("/whoami")
    @Operation(summary = "Return the authenticated user's identity and role")
    public Map<String, Object> whoami(@AuthenticationPrincipal AppUserPrincipal principal) {
        return Map.of(
                "id", principal.getId(),
                "email", principal.getEmail(),
                "fullName", principal.getFullName(),
                "role", principal.getRole().name()
        );
    }
}
