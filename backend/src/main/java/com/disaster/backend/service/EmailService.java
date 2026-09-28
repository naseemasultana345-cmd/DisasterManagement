package com.disaster.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class EmailService {

    @Value("${sendlib.api-key}")
    private String sendlibApiKey;

    @Value("${sendlib.sender-email}")
    private String senderEmail;

    private final HttpClient httpClient;

    public EmailService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public void sendPasswordResetOtp(String toEmail, String otp) {

        String emailHtml =
                "<div style=\"font-family: Arial, sans-serif; line-height: 1.6;\">" +
                "<h2>DisasterSafe - Password Reset</h2>" +
                "<p>Hello,</p>" +
                "<p>We received a request to reset your DisasterSafe password.</p>" +
                "<p>Your OTP is:</p>" +
                "<h1 style=\"letter-spacing: 5px;\">" + escapeHtml(otp) + "</h1>" +
                "<p>This OTP is valid for <strong>5 minutes</strong>.</p>" +
                "<p>If you did not request a password reset, please ignore this email.</p>" +
                "<br>" +
                "<p>Regards,<br>" +
                "<strong>DisasterSafe Emergency Management</strong></p>" +
                "</div>";

        String jsonBody =
                "{"
                + "\"from\":\"" + escapeJson(senderEmail) + "\","
                + "\"to\":\"" + escapeJson(toEmail) + "\","
                + "\"subject\":\"DisasterSafe - Password Reset OTP\","
                + "\"html\":\"" + escapeJson(emailHtml) + "\""
                + "}";

        try {

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://sendlib.samueltuoyo.com/api/send"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + sendlibApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse.BodyHandlers.ofString()
                    );

            if (response.statusCode() < 200 ||
                    response.statusCode() >= 300) {

                System.err.println("========== SENDLIB EMAIL ERROR ==========");
                System.err.println("HTTP Status: " + response.statusCode());
                System.err.println("Response: " + response.body());
                System.err.println("=========================================");

                throw new RuntimeException(
                        "Unable to send OTP email. Please try again."
                );
            }

            System.out.println("=========================================");
            System.out.println("OTP EMAIL SENT SUCCESSFULLY THROUGH SENDLIB");
            System.out.println("To: " + toEmail);
            System.out.println("=========================================");

        } catch (Exception e) {

            System.err.println("========== SENDLIB EMAIL ERROR ==========");
            System.err.println("Error type: " + e.getClass().getName());
            System.err.println("Error message: " + e.getMessage());
            System.err.println("==========================================");

            throw new RuntimeException(
                    "Unable to send OTP email. Please try again."
            );
        }
    }

    private String escapeJson(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}