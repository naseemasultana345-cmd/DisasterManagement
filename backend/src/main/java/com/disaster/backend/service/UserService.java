package com.disaster.backend.service;

import com.disaster.backend.entity.PasswordResetOtp;
import com.disaster.backend.entity.User;
import com.disaster.backend.repository.PasswordResetOtpRepository;
import com.disaster.backend.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    public UserService(
            UserRepository userRepository,
            PasswordResetOtpRepository otpRepository,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.emailService = emailService;
    }

    public User registerUser(User user) {

        String email = user.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }

        user.setEmail(email);

        return userRepository.save(user);
    }

    public User loginUser(String email, String password) {

        String normalizedEmail =
                email.trim().toLowerCase();

        User user = userRepository
                .findByEmail(normalizedEmail)
                .orElseThrow(
                        () -> new RuntimeException("User not found")
                );

        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("Invalid password");
        }

        return user;
    }

    // ==============================
    // FORGOT PASSWORD
    // ==============================
    @Transactional
    public void sendPasswordResetOtp(String email) {

        String normalizedEmail =
                email.trim().toLowerCase();

        User user = userRepository
                .findByEmail(normalizedEmail)
                .orElseThrow(
                        () -> new RuntimeException(
                                "No account found with this email"
                        )
                );

        // Remove any previous OTP
        otpRepository.deleteAllByEmail(normalizedEmail);

        // Generate 6-digit OTP
        String otp = String.format(
                "%06d",
                secureRandom.nextInt(1_000_000)
        );

        PasswordResetOtp resetOtp =
                new PasswordResetOtp(
                        normalizedEmail,
                        otp,
                        LocalDateTime.now().plusMinutes(5)
                );

        otpRepository.save(resetOtp);

        try {

            emailService.sendPasswordResetOtp(
                    user.getEmail(),
                    otp
            );

        } catch (Exception e) {

            otpRepository.deleteAllByEmail(normalizedEmail);

            throw new RuntimeException(
                    "Unable to send OTP email. Please try again."
            );
        }
    }

    // ==============================
    // VERIFY OTP
    // ==============================

    public String verifyPasswordResetOtp(
            String email,
            String enteredOtp
    ) {

        String normalizedEmail =
                email.trim().toLowerCase();

        PasswordResetOtp resetOtp =
                otpRepository
                        .findTopByEmailOrderByIdDesc(
                                normalizedEmail
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "OTP not found. Please request a new OTP."
                                )
                        );

        if (resetOtp.getExpiresAt()
                .isBefore(LocalDateTime.now())) {

            throw new RuntimeException(
                    "OTP has expired. Please request a new OTP."
            );
        }

        if (resetOtp.isVerified()) {

            throw new RuntimeException(
                    "OTP has already been verified."
            );
        }

        if (!resetOtp.getOtp().equals(enteredOtp.trim())) {

            throw new RuntimeException(
                    "Invalid OTP. Please check the OTP and try again."
            );
        }

        // OTP is correct
        resetOtp.setVerified(true);

        // Generate temporary password-reset token
        String resetToken =
                UUID.randomUUID().toString();

        resetOtp.setResetToken(resetToken);

        // Token valid for 10 minutes
        resetOtp.setResetTokenExpiresAt(
                LocalDateTime.now().plusMinutes(10)
        );

        otpRepository.save(resetOtp);

        return resetToken;
    }

    // ==============================
    // RESET PASSWORD
    // ==============================
    @Transactional
    public void resetPassword(
            String email,
            String resetToken,
            String newPassword
    ) {

        String normalizedEmail =
                email.trim().toLowerCase();

        if (newPassword == null ||
                newPassword.length() < 8) {

            throw new RuntimeException(
                    "Password must contain at least 8 characters."
            );
        }

        PasswordResetOtp resetOtp =
                otpRepository
                        .findTopByEmailOrderByIdDesc(
                                normalizedEmail
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Password reset session not found."
                                )
                        );

        if (!resetOtp.isVerified()) {

            throw new RuntimeException(
                    "Please verify the OTP first."
            );
        }

        if (resetOtp.getResetToken() == null ||
                !resetOtp.getResetToken().equals(resetToken)) {

            throw new RuntimeException(
                    "Invalid password reset token."
            );
        }

        if (resetOtp.getResetTokenExpiresAt() == null ||
                resetOtp.getResetTokenExpiresAt()
                        .isBefore(LocalDateTime.now())) {

            throw new RuntimeException(
                    "Password reset session has expired. Please start again."
            );
        }

        User user =
                userRepository
                        .findByEmail(normalizedEmail)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "User not found."
                                )
                        );

        /*
         * Your current authentication system stores passwords
         * as plain text, so this keeps compatibility with your
         * existing users.
         *
         * We can migrate the entire authentication system to
         * BCrypt afterward without breaking this flow.
         */
        user.setPassword(newPassword);

        userRepository.save(user);

        // Make the reset token single-use
        otpRepository.deleteAllByEmail(normalizedEmail);
    }
}