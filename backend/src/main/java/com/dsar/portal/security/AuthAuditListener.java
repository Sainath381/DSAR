package com.dsar.portal.security;

import com.dsar.portal.audit.AuditAction;
import com.dsar.portal.audit.AuditService;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.AbstractAuthenticationFailureEvent;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class AuthAuditListener {

    private final AuditService audit;

    public AuthAuditListener(AuditService audit) {
        this.audit = audit;
    }

    @EventListener
    public void onSuccess(AuthenticationSuccessEvent event) {
        Object principal = event.getAuthentication().getPrincipal();
        if (principal instanceof AppUserPrincipal p) {
            audit.record(p.getId(), p.getRole().name(),
                    AuditAction.LOGIN_SUCCESS,
                    "User", p.getId().toString(),
                    null,
                    Map.of("email", p.getEmail()));
        }
    }

    @EventListener
    public void onFailure(AbstractAuthenticationFailureEvent event) {
        String attempted = String.valueOf(event.getAuthentication().getName());
        audit.record(null, "ANONYMOUS",
                AuditAction.LOGIN_FAILURE,
                "User", null,
                null,
                Map.of("attemptedEmail", attempted,
                        "reason", event.getException().getClass().getSimpleName()));
    }
}
