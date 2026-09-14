package com.disaster.backend.config;

import java.util.HashMap;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;

import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            ClientRegistrationRepository clientRegistrationRepository)
            throws Exception {

        // =========================================================
        // OAuth2 Authorization Request Resolver
        // =========================================================

        DefaultOAuth2AuthorizationRequestResolver defaultResolver =
                new DefaultOAuth2AuthorizationRequestResolver(
                        clientRegistrationRepository,
                        "/oauth2/authorization"
                );

        OAuth2AuthorizationRequestResolver authorizationRequestResolver =
                new OAuth2AuthorizationRequestResolver() {

                    // =================================================
                    // Resolve OAuth2 request
                    // =================================================

                    @Override
                    public OAuth2AuthorizationRequest resolve(
                            HttpServletRequest request) {

                        OAuth2AuthorizationRequest authorizationRequest =
                                defaultResolver.resolve(request);

                        if (authorizationRequest == null) {
                            return null;
                        }

                        return customizeAuthorizationRequest(
                                request,
                                authorizationRequest,
                                null
                        );
                    }

                    // =================================================
                    // Resolve OAuth2 request with registration ID
                    // =================================================

                    @Override
                    public OAuth2AuthorizationRequest resolve(
                            HttpServletRequest request,
                            String clientRegistrationId) {

                        OAuth2AuthorizationRequest authorizationRequest =
                                defaultResolver.resolve(
                                        request,
                                        clientRegistrationId
                                );

                        if (authorizationRequest == null) {
                            return null;
                        }

                        return customizeAuthorizationRequest(
                                request,
                                authorizationRequest,
                                clientRegistrationId
                        );
                    }
                };

        // =========================================================
        // Spring Security Configuration
        // =========================================================

        http

                // =====================================================
                // Authorization
                // =====================================================

                .authorizeHttpRequests(authorize -> authorize

                        .requestMatchers(
                                "/api/auth/**",
                                "/oauth2/**",
                                "/login/**"
                        ).permitAll()

                        .anyRequest().permitAll()
                )

                // =====================================================
                // OAuth2 Login
                // Google + GitHub
                // =====================================================

                .oauth2Login(oauth2 -> oauth2

                        .authorizationEndpoint(
                                authorization -> authorization
                                        .authorizationRequestResolver(
                                                authorizationRequestResolver
                                        )
                        )

                        .defaultSuccessUrl(
                                "http://localhost:5173/dashboard",
                                true
                        )
                )

                // =====================================================
                // CSRF
                // =====================================================

                .csrf(csrf -> csrf.disable());

        return http.build();
    }

    // =============================================================
    // Customize OAuth2 Authorization Request
    // =============================================================

    private OAuth2AuthorizationRequest customizeAuthorizationRequest(
            HttpServletRequest request,
            OAuth2AuthorizationRequest authorizationRequest,
            String clientRegistrationId) {

        String registrationId = clientRegistrationId;

        // If registration ID wasn't directly supplied,
        // determine it from the request URL.
        if (registrationId == null) {

            String requestUri = request.getRequestURI();

            if (requestUri.endsWith("/google")) {
                registrationId = "google";
            } else if (requestUri.endsWith("/github")) {
                registrationId = "github";
            }
        }

        // =========================================================
        // GOOGLE
        // =========================================================
        //
        // Forces Google to show:
        //
        // "Choose an account"
        //
        // even when the browser is already logged into Google.
        // =========================================================

        if ("google".equals(registrationId)) {

            Map<String, Object> additionalParameters =
                    new HashMap<>(
                            authorizationRequest.getAdditionalParameters()
                    );

            additionalParameters.put(
                    "prompt",
                    "select_account"
            );

            return OAuth2AuthorizationRequest
                    .from(authorizationRequest)
                    .additionalParameters(additionalParameters)
                    .build();
        }

        // =========================================================
        // GITHUB
        // =========================================================
        //
        // GitHub does NOT support Google's
        // "prompt=select_account".
        //
        // Therefore we do not add Google's parameter to GitHub.
        // GitHub will use its normal OAuth authentication flow.
        // =========================================================

        if ("github".equals(registrationId)) {

            return authorizationRequest;
        }

        // =========================================================
        // Any other provider
        // =========================================================

        return authorizationRequest;
    }
}