package com.disaster.backend.service;

import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MobileOAuthCodeStore {

    private static final long CODE_VALIDITY_SECONDS = 120;

    private final SecureRandom secureRandom = new SecureRandom();

    private final Map<String, StoredOAuthUser> codes =
            new ConcurrentHashMap<>();

    // =========================================================
    // Existing method - used for OAuth2User based login
    // =========================================================

    public String createCode(OAuth2User oauthUser) {

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String code = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");
        String picture = oauthUser.getAttribute("picture");

        codes.put(
                code,
                new StoredOAuthUser(
                        email,
                        name,
                        picture,
                        Instant.now()
                )
        );

        cleanupExpiredCodes();

        return code;
    }

    // =========================================================
    // New method - used for mobile GitHub OAuth
    // =========================================================

    public String createCode(
            String email,
            String name,
            String picture
    ) {

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String code = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        codes.put(
                code,
                new StoredOAuthUser(
                        email,
                        name,
                        picture,
                        Instant.now()
                )
        );

        cleanupExpiredCodes();

        return code;
    }

    // =========================================================
    // Consume OAuth code
    // =========================================================

    public StoredOAuthUser consumeCode(String code) {

        if (code == null || code.trim().isEmpty()) {
            return null;
        }

        StoredOAuthUser storedUser = codes.remove(code);

        if (storedUser == null) {
            return null;
        }

        if (Instant.now()
                .minusSeconds(CODE_VALIDITY_SECONDS)
                .isAfter(storedUser.createdAt())) {

            return null;
        }

        return storedUser;
    }

    // =========================================================
    // Remove expired codes
    // =========================================================

    private void cleanupExpiredCodes() {

        Instant expiry =
                Instant.now().minusSeconds(CODE_VALIDITY_SECONDS);

        codes.entrySet().removeIf(entry ->
                entry.getValue()
                        .createdAt()
                        .isBefore(expiry)
        );
    }

    // =========================================================
    // Stored OAuth user data
    // =========================================================

    public record StoredOAuthUser(
            String email,
            String name,
            String picture,
            Instant createdAt
    ) {
    }
}