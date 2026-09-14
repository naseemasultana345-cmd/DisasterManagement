package com.disaster.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SMSService {

    // =========================================================
    // MSG91 CONFIGURATION
    // =========================================================

    @Value("${msg91.auth-key}")
    private String authKey;

    @Value("${msg91.flow-id}")
    private String flowId;

    @Value("${msg91.sender-id}")
    private String senderId;

    @Value("${admin.mobile}")
    private String adminMobile;


    // =========================================================
    // MSG91 API URL
    // =========================================================

    private static final String MSG91_FLOW_URL =
            "https://control.msg91.com/api/v5/flow";


    // =========================================================
    // SEND SOS SMS TO ADMIN
    // =========================================================

    public void sendSOSAlert(
            Long userId,
            Double latitude,
            Double longitude,
            String emergencyType) {

        try {

            // =================================================
            // VALIDATE ADMIN MOBILE
            // =================================================

            if (adminMobile == null ||
                    adminMobile.isBlank()) {

                System.err.println(
                        "SOS SMS NOT SENT: Admin mobile number is missing."
                );

                return;
            }


            // =================================================
            // VALIDATE MSG91 CONFIGURATION
            // =================================================

            if (authKey == null ||
                    authKey.isBlank()) {

                System.err.println(
                        "SOS SMS NOT SENT: MSG91 auth key is missing."
                );

                return;
            }


            if (flowId == null ||
                    flowId.isBlank()) {

                System.err.println(
                        "SOS SMS NOT SENT: MSG91 flow ID is missing."
                );

                return;
            }


            if (senderId == null ||
                    senderId.isBlank()) {

                System.err.println(
                        "SOS SMS NOT SENT: MSG91 sender ID is missing."
                );

                return;
            }


            // =================================================
            // FORMAT ADMIN MOBILE NUMBER
            // =================================================

            String formattedMobile =
                    formatIndianMobileNumber(
                            adminMobile
                    );


            // =================================================
            // CREATE HTTP HEADERS
            // =================================================

            HttpHeaders headers =
                    new HttpHeaders();

            headers.setContentType(
                    MediaType.APPLICATION_JSON
            );

            headers.set(
                    "authkey",
                    authKey
            );

            headers.set(
                    "accept",
                    MediaType.APPLICATION_JSON_VALUE
            );


            // =================================================
            // CREATE RECIPIENT
            // =================================================

            Map<String, Object> recipient =
                    new HashMap<>();


            // Example:
            // 919876543210

            recipient.put(
                    "mobiles",
                    formattedMobile
            );


            // =================================================
            // FLOW VARIABLES
            // =================================================

            recipient.put(
                    "USER_ID",
                    userId != null
                            ? String.valueOf(userId)
                            : "Unknown"
            );


            recipient.put(
                    "EMERGENCY_TYPE",
                    emergencyType != null &&
                            !emergencyType.isBlank()
                            ? emergencyType
                            : "GENERAL EMERGENCY"
            );


            recipient.put(
                    "LATITUDE",
                    latitude != null
                            ? String.valueOf(latitude)
                            : "Unknown"
            );


            recipient.put(
                    "LONGITUDE",
                    longitude != null
                            ? String.valueOf(longitude)
                            : "Unknown"
            );


            // =================================================
            // CREATE REQUEST BODY
            // =================================================

            Map<String, Object> requestBody =
                    new HashMap<>();


            requestBody.put(
                    "flow_id",
                    flowId
            );


            requestBody.put(
                    "sender",
                    senderId
            );


            requestBody.put(
                    "recipients",
                    List.of(recipient)
            );


            // =================================================
            // CREATE HTTP REQUEST
            // =================================================

            HttpEntity<Map<String, Object>> request =
                    new HttpEntity<>(
                            requestBody,
                            headers
                    );


            // =================================================
            // SEND REQUEST TO MSG91
            // =================================================

            RestTemplate restTemplate =
                    new RestTemplate();


            ResponseEntity<String> response =
                    restTemplate.postForEntity(
                            MSG91_FLOW_URL,
                            request,
                            String.class
                    );


            // =================================================
            // CHECK RESPONSE
            // =================================================

            System.out.println(
                    "========================================"
            );

            System.out.println(
                    "        SOS SMS REQUEST"
            );

            System.out.println(
                    "========================================"
            );

            System.out.println(
                    "Admin Mobile: "
                            + formattedMobile
            );

            System.out.println(
                    "User ID: "
                            + userId
            );

            System.out.println(
                    "Emergency Type: "
                            + emergencyType
            );

            System.out.println(
                    "Latitude: "
                            + latitude
            );

            System.out.println(
                    "Longitude: "
                            + longitude
            );

            System.out.println(
                    "MSG91 HTTP Status: "
                            + response.getStatusCode()
            );

            System.out.println(
                    "MSG91 Response: "
                            + response.getBody()
            );

            System.out.println(
                    "========================================"
            );


        } catch (Exception e) {

            // =================================================
            // IMPORTANT
            // =================================================
            //
            // SMS failure must NOT cancel the SOS.
            //
            // The SOS has already been saved in the database.
            // Therefore, we only log the SMS error.
            // =================================================

            System.err.println(
                    "========================================"
            );

            System.err.println(
                    "FAILED TO SEND SOS SMS"
            );

            System.err.println(
                    "Error: "
                            + e.getMessage()
            );

            System.err.println(
                    "========================================"
            );
        }
    }


    // =========================================================
    // FORMAT INDIAN MOBILE NUMBER
    // =========================================================
    //
    // Accepted examples:
    //
    // 9876543210
    // +919876543210
    // 919876543210
    //
    // MSG91 requires international format.
    // Example:
    // 919876543210
    // =========================================================

    private String formatIndianMobileNumber(
            String mobile) {

        String number =
                mobile.trim()
                        .replaceAll(
                                "[^0-9]",
                                ""
                        );


        // -----------------------------------------------------
        // Already has country code
        // -----------------------------------------------------

        if (number.startsWith("91") &&
                number.length() == 12) {

            return number;
        }


        // -----------------------------------------------------
        // Normal Indian 10-digit number
        // -----------------------------------------------------

        if (number.length() == 10) {

            return "91" + number;
        }


        // -----------------------------------------------------
        // Invalid number
        // -----------------------------------------------------

        throw new IllegalArgumentException(
                "Invalid Indian mobile number: "
                        + mobile
        );
    }
}