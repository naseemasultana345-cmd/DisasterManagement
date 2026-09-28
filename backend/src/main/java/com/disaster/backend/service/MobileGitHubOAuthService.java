package com.disaster.backend.service;

import com.disaster.backend.entity.User;
import com.disaster.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MobileGitHubOAuthService {

    private static final String GITHUB_AUTHORIZE_URL =
            "https://github.com/login/oauth/authorize";

    private static final String GITHUB_TOKEN_URL =
            "https://github.com/login/oauth/access_token";

    private static final String GITHUB_USER_URL =
            "https://api.github.com/user";

    private static final String GITHUB_EMAILS_URL =
            "https://api.github.com/user/emails";

    private static final String MOBILE_REDIRECT_URI =
            "https://disastermanagement-gzg8.onrender.com/api/auth/github/mobile/callback";

    private final UserRepository userRepository;
    private final MobileOAuthCodeStore mobileOAuthCodeStore;

    private final RestClient restClient;

    private final SecureRandom secureRandom =
            new SecureRandom();

    private final Map<String, Long> states =
            new ConcurrentHashMap<>();

    @Value("${github.mobile.client-id:${MOBILE_GITHUB_CLIENT_ID}}")
    private String clientId;

    @Value("${github.mobile.client-secret:${MOBILE_GITHUB_CLIENT_SECRET}}")
    private String clientSecret;


    public MobileGitHubOAuthService(
            UserRepository userRepository,
            MobileOAuthCodeStore mobileOAuthCodeStore
    ) {
        this.userRepository =
                userRepository;

        this.mobileOAuthCodeStore =
                mobileOAuthCodeStore;

        this.restClient =
                RestClient.builder().build();
    }


    // ============================================================
    // CREATE GITHUB AUTHORIZATION URL
    // ============================================================

    public String createAuthorizationUrl() {

        cleanupStates();

        byte[] randomBytes =
                new byte[32];

        secureRandom.nextBytes(
                randomBytes
        );

        String state =
                Base64.getUrlEncoder()
                        .withoutPadding()
                        .encodeToString(
                                randomBytes
                        );

        states.put(
                state,
                System.currentTimeMillis()
        );

        return GITHUB_AUTHORIZE_URL
                + "?client_id="
                + clientId
                + "&redirect_uri="
                + MOBILE_REDIRECT_URI
                + "&scope=read:user%20user:email"
                + "&state="
                + state;
    }


    // ============================================================
    // HANDLE GITHUB CALLBACK
    // ============================================================

    public String handleCallback(
            String code,
            String state
    ) {

        if (code == null ||
                code.trim().isEmpty()) {

            throw new RuntimeException(
                    "GitHub authorization code is missing."
            );
        }

        if (state == null ||
                state.trim().isEmpty()) {

            throw new RuntimeException(
                    "GitHub OAuth state is missing."
            );
        }

        Long createdAt =
                states.remove(state);

        if (createdAt == null) {

            throw new RuntimeException(
                    "Invalid or expired GitHub OAuth state."
            );
        }

        /*
         * State is valid for 5 minutes.
         */
        if (
                System.currentTimeMillis()
                        - createdAt
                        > 5 * 60 * 1000
        ) {

            throw new RuntimeException(
                    "GitHub OAuth session has expired."
            );
        }


        // ========================================================
        // EXCHANGE CODE FOR ACCESS TOKEN
        // ========================================================

        Map<?, ?> tokenResponse =
                restClient
                        .post()
                        .uri(
                                GITHUB_TOKEN_URL
                        )
                        .header(
                                "Accept",
                                "application/json"
                        )
                        .body(
                                Map.of(
                                        "client_id",
                                        clientId,

                                        "client_secret",
                                        clientSecret,

                                        "code",
                                        code,

                                        "redirect_uri",
                                        MOBILE_REDIRECT_URI
                                )
                        )
                        .retrieve()
                        .body(
                                Map.class
                        );

        if (tokenResponse == null) {

            throw new RuntimeException(
                    "GitHub did not return an access token."
            );
        }

        Object tokenObject =
                tokenResponse.get(
                        "access_token"
                );

        if (tokenObject == null) {

            throw new RuntimeException(
                    "Unable to obtain GitHub access token."
            );
        }

        String accessToken =
                tokenObject.toString();


        // ========================================================
        // GET GITHUB USER
        // ========================================================

        Map<?, ?> githubUser =
                restClient
                        .get()
                        .uri(
                                GITHUB_USER_URL
                        )
                        .header(
                                "Authorization",
                                "Bearer " + accessToken
                        )
                        .header(
                                "Accept",
                                "application/vnd.github+json"
                        )
                        .retrieve()
                        .body(
                                Map.class
                        );

        if (githubUser == null) {

            throw new RuntimeException(
                    "Unable to retrieve GitHub user."
            );
        }


        String name =
                githubUser.get("name") == null
                        ? ""
                        : githubUser
                                .get("name")
                                .toString();

        String login =
                githubUser.get("login") == null
                        ? ""
                        : githubUser
                                .get("login")
                                .toString();

        String picture =
                githubUser.get("avatar_url") == null
                        ? ""
                        : githubUser
                                .get("avatar_url")
                                .toString();

        String email =
                githubUser.get("email") == null
                        ? ""
                        : githubUser
                                .get("email")
                                .toString();


        // ========================================================
        // GITHUB MAY RETURN NULL EMAIL
        //
        // If public email is unavailable, retrieve the user's
        // verified email addresses from /user/emails.
        // ========================================================

        if (email.isBlank()) {

            email =
                    getVerifiedGitHubEmail(
                            accessToken
                    );
        }

        if (email.isBlank()) {

            throw new RuntimeException(
                    "No email address is available from your GitHub account."
            );
        }

        email =
                email.trim()
                        .toLowerCase();


        if (name.isBlank()) {

            name = login;
        }


        // ========================================================
        // FIND OR CREATE USER
        // ========================================================

        User user =
                userRepository
                        .findByEmail(email)
                        .orElse(null);

        if (user == null) {

            user =
                    new User();

            user.setFullName(
                    name
            );

            user.setEmail(
                    email
            );

            /*
             * Your current User entity requires phone and password.
             * These are only compatibility values for OAuth accounts.
             */
            user.setPhone(
                    "GITHUB"
            );

            user.setPassword(
                    UUID.randomUUID()
                            .toString()
            );

            user =
                    userRepository.save(
                            user
                    );
        }


        // ========================================================
        // CREATE ONE-TIME MOBILE CODE
        // ========================================================

        String mobileCode =
                mobileOAuthCodeStore.createCode(
                        user.getEmail(),
                        user.getFullName(),
                        picture
                );

        return mobileCode;
    }


    // ============================================================
    // GET VERIFIED GITHUB EMAIL
    // ============================================================

    private String getVerifiedGitHubEmail(
            String accessToken
    ) {

        var emails =
                restClient
                        .get()
                        .uri(
                                GITHUB_EMAILS_URL
                        )
                        .header(
                                "Authorization",
                                "Bearer " + accessToken
                        )
                        .header(
                                "Accept",
                                "application/vnd.github+json"
                        )
                        .retrieve()
                        .body(
                                java.util.List.class
                        );

        if (emails == null) {
            return "";
        }

        for (
                Object item : emails
        ) {

            if (!(item instanceof Map<?, ?> emailData)) {
                continue;
            }

            Object emailObject =
                    emailData.get("email");

            Object verifiedObject =
                    emailData.get("verified");

            if (
                    emailObject != null
                            &&
                    Boolean.TRUE.equals(
                            verifiedObject
                    )
            ) {

                return emailObject.toString();
            }
        }

        return "";
    }


    // ============================================================
    // CLEAN EXPIRED STATES
    // ============================================================

    private void cleanupStates() {

        long expiry =
                System.currentTimeMillis()
                        - 5 * 60 * 1000;

        states.entrySet()
                .removeIf(
                        entry ->
                                entry.getValue()
                                        < expiry
                );
    }
}