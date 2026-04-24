package com.dsar.portal.request;

import com.dsar.portal.audit.AuditAction;
import com.dsar.portal.audit.AuditLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end lifecycle test:
 *   customer submits CORRECT → admin reviews → approves → completes
 * Asserts every required audit row is written (append-only).
 */
@SpringBootTest
@ActiveProfiles("test")
class RequestLifecycleIntegrationTest {

    @Autowired WebApplicationContext ctx;
    @Autowired AuditLogRepository auditRepo;
    @Autowired ObjectMapper mapper;

    private MockMvc mvc;

    private static final String CUSTOMER = "customer@demo.io";
    private static final String CUSTOMER_PW = "customer123";
    private static final String ADMIN = "admin@demo.io";
    private static final String ADMIN_PW = "admin123";

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(ctx).apply(springSecurity()).build();
    }

    @Test
    @DisplayName("full CORRECT lifecycle produces 5 request-scoped audit rows with correct actions")
    void fullCorrectLifecycle() throws Exception {
        // 1) customer submits CORRECT
        MvcResult created = mvc.perform(post("/api/customer/requests")
                        .with(httpBasic(CUSTOMER, CUSTOMER_PW))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"type":"CORRECT",
                                 "payload":{"field":"fullName","newValue":"New Name"}}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andReturn();

        JsonNode body = mapper.readTree(created.getResponse().getContentAsString());
        String id = body.get("id").asText();

        // 2) admin progresses through the state machine
        transition(id, "IN_REVIEW", null);
        transition(id, "APPROVED", null);

        // 3) admin completes → action executes
        mvc.perform(post("/api/admin/requests/" + id + "/complete")
                        .with(httpBasic(ADMIN, ADMIN_PW)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.result.kind").value("USER_CORRECTED"));

        // 4) audit: filter to this request's rows — must be exactly
        //    REQUEST_CREATED + STATUS_CHANGED ×3 + ACTION_EXECUTED.
        //    (The audit log also contains LOGIN_SUCCESS rows from each Basic-Auth
        //    call, which is the correct behavior of a stateless API, so we don't
        //    over-constrain the total count.)
        var rows = auditRepo.findAll().stream()
                .filter(a -> id.equals(a.getEntityId()))
                .toList();

        assertThat(rows).extracting(a -> a.getAction())
                .containsExactlyInAnyOrder(
                        AuditAction.REQUEST_CREATED,
                        AuditAction.STATUS_CHANGED,
                        AuditAction.STATUS_CHANGED,
                        AuditAction.STATUS_CHANGED,
                        AuditAction.ACTION_EXECUTED
                );
    }

    @Test
    @DisplayName("illegal transition returns 409 Conflict")
    void illegalTransitionRejected() throws Exception {
        String id = submitAccess();
        // Try to skip straight to APPROVED
        mvc.perform(post("/api/admin/requests/" + id + "/transition")
                        .with(httpBasic(ADMIN, ADMIN_PW))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"targetStatus":"APPROVED"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("Illegal transition")));
    }

    @Test
    @DisplayName("rejection without a note returns 400")
    void rejectRequiresNote() throws Exception {
        String id = submitAccess();
        mvc.perform(post("/api/admin/requests/" + id + "/transition")
                        .with(httpBasic(ADMIN, ADMIN_PW))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"targetStatus":"REJECTED"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("justification")));
    }

    @Test
    @DisplayName("export is gated on COMPLETED status")
    void exportRequiresCompleted() throws Exception {
        String id = submitAccess();
        mvc.perform(get("/api/customer/requests/" + id + "/export")
                        .with(httpBasic(CUSTOMER, CUSTOMER_PW)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("CORRECT with forbidden field returns 400")
    void correctEmailRejected() throws Exception {
        mvc.perform(post("/api/customer/requests")
                        .with(httpBasic(CUSTOMER, CUSTOMER_PW))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"type":"CORRECT",
                                 "payload":{"field":"email","newValue":"hack@attacker.io"}}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE without confirmed flag returns 400")
    void deleteRequiresConfirmed() throws Exception {
        mvc.perform(post("/api/customer/requests")
                        .with(httpBasic(CUSTOMER, CUSTOMER_PW))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"type":"DELETE"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("confirmed")));
    }

    // helpers

    private String submitAccess() throws Exception {
        MvcResult r = mvc.perform(post("/api/customer/requests")
                        .with(httpBasic(CUSTOMER, CUSTOMER_PW))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"type":"ACCESS","note":"test"}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        return mapper.readTree(r.getResponse().getContentAsString()).get("id").asText();
    }

    private void transition(String id, String target, String note) throws Exception {
        String json = note == null
                ? "{\"targetStatus\":\"" + target + "\"}"
                : "{\"targetStatus\":\"" + target + "\",\"note\":\"" + note + "\"}";
        mvc.perform(post("/api/admin/requests/" + id + "/transition")
                        .with(httpBasic(ADMIN, ADMIN_PW))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(target));
    }
}
