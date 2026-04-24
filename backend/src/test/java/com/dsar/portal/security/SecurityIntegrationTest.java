package com.dsar.portal.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;

/**
 * Verifies Spring Security wiring end-to-end, driving through the real filter chain.
 */
@SpringBootTest
@ActiveProfiles("test")
class SecurityIntegrationTest {

    @Autowired
    private WebApplicationContext ctx;

    private MockMvc mvc;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
    }

    @Test
    @DisplayName("public /health does not require auth")
    void healthPublic() throws Exception {
        mvc.perform(get("/health")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("authed endpoint returns 401 without credentials")
    void whoamiAnonymous() throws Exception {
        mvc.perform(get("/api/auth/whoami")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("customer can see own requests, 403 on admin endpoints")
    void customerRoleEnforcement() throws Exception {
        mvc.perform(get("/api/customer/requests")
                        .with(httpBasic("customer@demo.io", "customer123")))
                .andExpect(status().isOk());

        mvc.perform(get("/api/admin/requests")
                        .with(httpBasic("customer@demo.io", "customer123")))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/admin/audit")
                        .with(httpBasic("customer@demo.io", "customer123")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("admin can see queue + audit, 403 on customer endpoints")
    void adminRoleEnforcement() throws Exception {
        mvc.perform(get("/api/admin/requests")
                        .with(httpBasic("admin@demo.io", "admin123")))
                .andExpect(status().isOk());

        mvc.perform(get("/api/admin/audit")
                        .with(httpBasic("admin@demo.io", "admin123")))
                .andExpect(status().isOk());

        mvc.perform(get("/api/customer/requests")
                        .with(httpBasic("admin@demo.io", "admin123")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("whoami returns identity + role")
    void whoamiShape() throws Exception {
        mvc.perform(get("/api/auth/whoami")
                        .with(httpBasic("admin@demo.io", "admin123"))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.email").value("admin@demo.io"));
    }

    @Test
    @DisplayName("bad password returns 401")
    void badPassword() throws Exception {
        mvc.perform(get("/api/auth/whoami")
                        .with(httpBasic("admin@demo.io", "wrong-password")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("non-existent path returns 404 (not 500)")
    void noRoute() throws Exception {
        mvc.perform(get("/api/totally-made-up")
                        .with(httpBasic("admin@demo.io", "admin123")))
                .andExpect(status().isNotFound());
    }
}
