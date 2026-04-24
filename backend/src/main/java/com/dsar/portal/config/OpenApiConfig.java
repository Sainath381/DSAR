package com.dsar.portal.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI dsarOpenAPI() {
        final String scheme = "basicAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("DSAR Portal API")
                        .description("""
                                Data Subject Access Request portal — a GDPR-aligned MVP.

                                **Customers** submit privacy requests (Access / Delete / Correct),
                                **Admins** process them through a state machine, and every action is
                                captured in an append-only audit log.

                                Authentication is HTTP Basic. Use the seeded users:
                                - `customer@demo.io` / `customer123` (CUSTOMER)
                                - `admin@demo.io` / `admin123` (ADMIN)
                                """)
                        .version("v0.1-mvp")
                        .license(new License().name("MIT")))
                .addSecurityItem(new SecurityRequirement().addList(scheme))
                .components(new Components()
                        .addSecuritySchemes(scheme,
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("basic")));
    }
}
