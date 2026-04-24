package com.dsar.portal.config;

import com.dsar.portal.audit.AuditAction;
import com.dsar.portal.audit.AuditService;
import com.dsar.portal.user.Role;
import com.dsar.portal.user.User;
import com.dsar.portal.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;

@Configuration
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AuditService audit;

    public DataSeeder(UserRepository users, PasswordEncoder encoder, AuditService audit) {
        this.users = users;
        this.encoder = encoder;
        this.audit = audit;
    }

    @Override
    public void run(String... args) {
        seed("admin@demo.io", "admin123", "Arjun Admin", Role.ADMIN);
        seed("customer@demo.io", "customer123", "Priya Customer", Role.CUSTOMER);
        seed("jane@demo.io", "jane123", "Jane Doe", Role.CUSTOMER);
    }

    private void seed(String email, String rawPassword, String fullName, Role role) {
        if (users.existsByEmailIgnoreCase(email)) {
            log.debug("User {} already present; skipping seed.", email);
            return;
        }
        User u = User.builder()
                .email(email)
                .fullName(fullName)
                .passwordHash(encoder.encode(rawPassword))
                .role(role)
                .deleted(false)
                .build();
        u = users.save(u);
        audit.record(null, "SYSTEM", AuditAction.USER_SEEDED,
                "User", u.getId().toString(),
                null,
                Map.of("email", email, "role", role.name()));
        log.info("Seeded {} user: {}", role, email);
    }
}
