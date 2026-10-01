package com.disaster.backend.controller;

import com.disaster.backend.entity.SOSRequest;
import com.disaster.backend.service.SOSService;
import com.disaster.backend.service.TextbeltSmsService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sos")
public class SOSController {

    private final SOSService sosService;
    private final TextbeltSmsService textbeltSmsService;


    public SOSController(
            SOSService sosService,
            TextbeltSmsService textbeltSmsService) {

        this.sosService = sosService;
        this.textbeltSmsService = textbeltSmsService;
    }


    // =========================================================
    // CREATE SOS
    // POST /api/sos
    // =========================================================

    @PostMapping
    public ResponseEntity<Map<String, Object>> createSOS(
            @RequestBody SOSRequest sosRequest) {

        // -----------------------------------------------------
        // 1. SAVE SOS TO DATABASE
        // -----------------------------------------------------

        SOSRequest savedSOS =
                sosService.createSOS(
                        sosRequest
                );


        // -----------------------------------------------------
        // 2. SEND SMS TO ONE EMERGENCY NUMBER
        // -----------------------------------------------------

        boolean smsSent = false;

        try {

            smsSent =
                    textbeltSmsService.sendSOSMessage(
                            savedSOS.getLatitude(),
                            savedSOS.getLongitude(),
                            savedSOS.getEmergencyType()
                    );

        } catch (Exception e) {

            System.err.println(
                    "SOS SMS sending failed: "
                            + e.getMessage()
            );
        }


        // -----------------------------------------------------
        // 3. RETURN RESPONSE
        // -----------------------------------------------------

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "sos",
                savedSOS
        );

        response.put(
                "smsSent",
                smsSent
        );

        response.put(
                "message",
                smsSent
                        ? "SOS created and SMS sent successfully"
                        : "SOS created, but SMS could not be sent"
        );


        return ResponseEntity.ok(
                response
        );
    }


    // =========================================================
    // GET ALL SOS
    // GET /api/sos
    // =========================================================

    @GetMapping
    public ResponseEntity<List<SOSRequest>> getAllSOS() {

        return ResponseEntity.ok(
                sosService.getAllSOS()
        );
    }


    // =========================================================
    // GET ACTIVE SOS
    // GET /api/sos/active
    // =========================================================

    @GetMapping("/active")
    public ResponseEntity<List<SOSRequest>> getActiveSOS() {

        return ResponseEntity.ok(
                sosService.getActiveSOS()
        );
    }


    // =========================================================
    // UPDATE SOS STATUS
    // PUT /api/sos/{id}/status
    // =========================================================

    @PutMapping("/{id}/status")
    public ResponseEntity<SOSRequest> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        SOSRequest updatedSOS =
                sosService.updateStatus(
                        id,
                        status
                );

        return ResponseEntity.ok(
                updatedSOS
        );
    }
}