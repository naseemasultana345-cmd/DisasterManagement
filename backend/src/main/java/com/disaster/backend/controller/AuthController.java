package com.disaster.backend.controller;

import com.disaster.backend.entity.User;
import com.disaster.backend.service.MobileGitHubOAuthService;
import com.disaster.backend.service.MobileOAuthCodeStore;
import com.disaster.backend.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://disaster-management-pink-seven.vercel.app",
        "capacitor://localhost",
        "https://localhost",
        "http://localhost"
})
public class AuthController {

    private final UserService userService;

    private final MobileOAuthCodeStore mobileOAuthCodeStore;

    private final MobileGitHubOAuthService mobileGitHubOAuthService;

    public AuthController(
            UserService userService,
            MobileOAuthCodeStore mobileOAuthCodeStore,
            MobileGitHubOAuthService mobileGitHubOAuthService
    ) {
        this.userService =
                userService;

        this.mobileOAuthCodeStore =
                mobileOAuthCodeStore;

        this.mobileGitHubOAuthService =
                mobileGitHubOAuthService;
    }

    // =========================================================
    // NORMAL REGISTER
    // =========================================================

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody User user
    ) {

        try {

            User savedUser =
                    userService.registerUser(user);

            return ResponseEntity.ok(
                    savedUser
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    // =========================================================
    // NORMAL LOGIN
    // =========================================================

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody User user
    ) {

        try {

            User loggedInUser =
                    userService.loginUser(
                            user.getEmail(),
                            user.getPassword()
                    );

            return ResponseEntity.ok(
                    loggedInUser
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    // =========================================================
    // WEB GOOGLE OAUTH START
    // =========================================================

    @GetMapping("/web/oauth/google")
    public void startWebGoogleOAuth(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        /*
         * Mark this OAuth request as a WEB login.
         *
         * SecurityConfig will check this value after
         * Google authentication is completed.
         */
        request.getSession()
                .setAttribute(
                        "WEB_OAUTH",
                        true
                );

        /*
         * Start Spring Security Google OAuth.
         */
        response.sendRedirect(
                "/oauth2/authorization/google"
        );
    }

    // =========================================================
    // WEB GITHUB OAUTH START
    // =========================================================

    @GetMapping("/web/oauth/github")
    public void startWebGithubOAuth(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        /*
         * Mark this OAuth request as a WEB login.
         */
        request.getSession()
                .setAttribute(
                        "WEB_OAUTH",
                        true
                );

        /*
         * Start Spring Security GitHub OAuth.
         */
        response.sendRedirect(
                "/oauth2/authorization/github"
        );
    }

    // =========================================================
    // MOBILE GITHUB OAUTH START
    // =========================================================

    @GetMapping("/github/mobile/start")
    public ResponseEntity<?> startMobileGitHubLogin() {

        try {

            String authorizationUrl =
                    mobileGitHubOAuthService
                            .createAuthorizationUrl();

            return ResponseEntity
                    .status(302)
                    .header(
                            "Location",
                            authorizationUrl
                    )
                    .build();

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );
        }
    }

    // =========================================================
    // MOBILE GITHUB CALLBACK
    // =========================================================

    @GetMapping("/github/mobile/callback")
    public ResponseEntity<?> mobileGitHubCallback(
            @RequestParam(
                    required = false
            )
            String code,

            @RequestParam(
                    required = false
            )
            String state,

            @RequestParam(
                    required = false
            )
            String error
    ) {

        try {

            /*
             * GitHub returned an error.
             */
            if (
                    error != null &&
                    !error.isBlank()
            ) {

                String redirectUrl =
                        "com.disastermanagement.app://oauth2redirect"
                                + "?error="
                                + URLEncoder.encode(
                                        error,
                                        StandardCharsets.UTF_8
                                );

                return ResponseEntity
                        .status(302)
                        .header(
                                "Location",
                                redirectUrl
                        )
                        .build();
            }

            /*
             * Process GitHub callback.
             */
            String mobileCode =
                    mobileGitHubOAuthService
                            .handleCallback(
                                    code,
                                    state
                            );

            /*
             * Send the one-time code to Android.
             */
            String redirectUrl =
                    "com.disastermanagement.app://oauth2redirect"
                            + "?code="
                            + URLEncoder.encode(
                                    mobileCode,
                                    StandardCharsets.UTF_8
                            );

            return ResponseEntity
                    .status(302)
                    .header(
                            "Location",
                            redirectUrl
                    )
                    .build();

        } catch (RuntimeException e) {

            String errorMessage =
                    e.getMessage() == null
                            ? "GitHub login failed."
                            : e.getMessage();

            String redirectUrl =
                    "com.disastermanagement.app://oauth2redirect"
                            + "?error="
                            + URLEncoder.encode(
                                    errorMessage,
                                    StandardCharsets.UTF_8
                            );

            return ResponseEntity
                    .status(302)
                    .header(
                            "Location",
                            redirectUrl
                    )
                    .build();
        }
    }

    // =========================================================
    // MOBILE OAUTH CODE EXCHANGE
    // =========================================================

    @PostMapping("/mobile/oauth/exchange")
    public ResponseEntity<?> exchangeMobileOAuthCode(
            @RequestBody Map<String, String> request
    ) {

        String code =
                request.get("code");

        if (
                code == null ||
                code.trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "OAuth code is required."
                            )
                    );
        }

        MobileOAuthCodeStore.StoredOAuthUser oauthUser =
                mobileOAuthCodeStore
                        .consumeCode(code);

        if (oauthUser == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "OAuth code is invalid or expired."
                            )
                    );
        }

        return ResponseEntity.ok(
                Map.of(
                        "email",
                        oauthUser.email() == null
                                ? ""
                                : oauthUser.email(),

                        "name",
                        oauthUser.name() == null
                                ? ""
                                : oauthUser.name(),

                        "picture",
                        oauthUser.picture() == null
                                ? ""
                                : oauthUser.picture()
                )
        );
    }

    // =========================================================
    // FORGOT PASSWORD
    // =========================================================

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @RequestBody Map<String, String> request
    ) {

        try {

            String email =
                    request.get("email");

            if (
                    email == null ||
                    email.trim().isEmpty()
            ) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "Please enter your email address."
                        );
            }

            userService.sendPasswordResetOtp(
                    email
            );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "OTP sent successfully to your email."
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    // =========================================================
    // VERIFY OTP
    // =========================================================

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(
            @RequestBody Map<String, String> request
    ) {

        try {

            String email =
                    request.get("email");

            String otp =
                    request.get("otp");

            if (
                    email == null ||
                    email.trim().isEmpty()
            ) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "Email is required."
                        );
            }

            if (
                    otp == null ||
                    otp.trim().isEmpty()
            ) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "OTP is required."
                        );
            }

            String resetToken =
                    userService
                            .verifyPasswordResetOtp(
                                    email,
                                    otp
                            );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "OTP verified successfully.",

                            "resetToken",
                            resetToken
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    // =========================================================
    // RESET PASSWORD
    // =========================================================

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestBody Map<String, String> request
    ) {

        try {

            String email =
                    request.get("email");

            String resetToken =
                    request.get("resetToken");

            String newPassword =
                    request.get("newPassword");

            if (
                    email == null ||
                    email.trim().isEmpty()
            ) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "Email is required."
                        );
            }

            if (
                    resetToken == null ||
                    resetToken.trim().isEmpty()
            ) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "Reset token is required."
                        );
            }

            if (
                    newPassword == null ||
                    newPassword.isEmpty()
            ) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "New password is required."
                        );
            }

            userService.resetPassword(
                    email,
                    resetToken,
                    newPassword
            );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Password updated successfully."
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }
}
