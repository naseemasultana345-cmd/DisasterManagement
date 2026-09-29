
package com.disaster.backend.config;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import com.disaster.backend.service.MobileOAuthCodeStore;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.user.OAuth2User;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class SecurityConfig {

    private final MobileOAuthCodeStore mobileOAuthCodeStore;

    public SecurityConfig(
            MobileOAuthCodeStore mobileOAuthCodeStore
    ) {
        this.mobileOAuthCodeStore =
                mobileOAuthCodeStore;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            ClientRegistrationRepository clientRegistrationRepository
    ) throws Exception {

        OAuth2AuthorizationRequestResolver
                authorizationRequestResolver =
                new DefaultOAuth2AuthorizationRequestResolver(
                        clientRegistrationRepository,
                        "/oauth2/authorization"
                );

        http
                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                .authorizeHttpRequests(authorize -> authorize

                        // Normal authentication APIs
                        .requestMatchers(
                                "/api/auth/**"
                        )
                        .permitAll()

                        // OAuth endpoints
                        .requestMatchers(
                                "/oauth2/**",
                                "/login/**"
                        )
                        .permitAll()

                        .anyRequest()
                        .permitAll()
                )

                .oauth2Login(oauth2 -> oauth2

                        .authorizationEndpoint(
                                authorization ->
                                        authorization
                                                .authorizationRequestResolver(
                                                        authorizationRequestResolver
                                                )
                        )

                        /*
                         * After Google/GitHub authentication,
                         * this handler decides whether the login
                         * came from:
                         *
                         * 1. Web browser
                         * 2. Android application
                         */
                        .successHandler(
                                mobileOAuthSuccessHandler()
                        )
                )

                .csrf(csrf ->
                        csrf.disable()
                );

        return http.build();
    }

    @Bean
    public AuthenticationSuccessHandler
    mobileOAuthSuccessHandler() {

        return (
                HttpServletRequest request,
                HttpServletResponse response,
                org.springframework.security.core.Authentication authentication
        ) -> {

            /*
             * Check whether this OAuth login was started
             * from the web browser.
             */
            Boolean webOAuth =
                    (Boolean) request
                            .getSession()
                            .getAttribute("WEB_OAUTH");

            /*
             * WEB LOGIN
             *
             * If Google/GitHub login started from Firefox,
             * redirect back to the React application.
             */
            if (Boolean.TRUE.equals(webOAuth)) {

                // Remove the marker after using it.
                request.getSession()
                        .removeAttribute("WEB_OAUTH");

                response.sendRedirect(
                        "https://disaster-management-pink-seven.vercel.app/dashboard"
                );

                return;
            }

            /*
             * ANDROID LOGIN
             *
             * Keep the existing Android OAuth flow.
             */
            OAuth2User oauthUser =
                    (OAuth2User) authentication.getPrincipal();

            String code =
                    mobileOAuthCodeStore.createCode(
                            oauthUser
                    );

            String redirectUrl =
                    "com.disastermanagement.app://oauth2redirect"
                            + "?code="
                            + URLEncoder.encode(
                                    code,
                                    StandardCharsets.UTF_8
                            );

            response.sendRedirect(
                    redirectUrl
            );
        };
    }

    @Bean
    public CorsConfigurationSource
    corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                Arrays.asList(
                        "http://localhost:5173",
                        "https://disaster-management-pink-seven.vercel.app",
                        "capacitor://localhost",
                        "https://localhost",
                        "http://localhost"
                )
        );

        configuration.setAllowedMethods(
                Arrays.asList(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                Arrays.asList("*")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }

    @Bean
    public CorsFilter corsFilter() {

        return new CorsFilter(
                corsConfigurationSource()
        );
    }
}
