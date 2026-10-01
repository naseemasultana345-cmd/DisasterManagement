package com.disaster.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class TextbeltSmsService {

    @Value("${textbelt.api.url}")
    private String textbeltApiUrl;

    @Value("${textbelt.api.key}")
    private String textbeltApiKey;

    @Value("${textbelt.emergency.phone}")
    private String emergencyPhone;

    private final RestClient restClient;

    public TextbeltSmsService() {
        this.restClient = RestClient.create();
    }

    public boolean sendSOSMessage(
            Double latitude,
            Double longitude,
            String emergencyType
    ) {

        String locationText =
                "https://www.google.com/maps?q="
                        + latitude + "," + longitude;

        String message =
                "DISASTERSAFE SOS ALERT\n\n" +
                "Emergency: " + emergencyType + "\n" +
                "Location: " + locationText + "\n\n" +
                "Please contact me immediately.";

        try {

            Map<String, String> request = Map.of(
                    "phone", emergencyPhone,
                    "message", message,
                    "key", textbeltApiKey
            );

            Map<?, ?> response = restClient
                    .post()
                    .uri(textbeltApiUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(Map.class);

            System.out.println("========================================");
            System.out.println("        TEXTBELT SMS RESPONSE");
            System.out.println("========================================");
            System.out.println("Phone: " + emergencyPhone);
            System.out.println("Emergency Type: " + emergencyType);
            System.out.println("Textbelt Response: " + response);
            System.out.println("========================================");

            if (response != null) {

                Object success =
                        response.get("success");

                return Boolean.TRUE.equals(success);
            }

        } catch (Exception e) {

            System.err.println(
                    "========================================"
            );

            System.err.println(
                    "        TEXTBELT SMS FAILED"
            );

            System.err.println(
                    "========================================"
            );

            System.err.println(
                    "Error: " + e.getMessage()
            );

            System.err.println(
                    "========================================"
            );
        }

        return false;
    }
}
