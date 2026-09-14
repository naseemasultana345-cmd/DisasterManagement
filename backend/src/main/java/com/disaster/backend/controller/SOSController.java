package com.disaster.backend.controller;

import com.disaster.backend.entity.SOSRequest;
import com.disaster.backend.service.SOSService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sos")
@CrossOrigin(origins = "http://localhost:5173")
public class SOSController {

    private final SOSService sosService;

    public SOSController(
            SOSService sosService) {

        this.sosService = sosService;
    }


    // =========================================================
    // CREATE SOS
    // POST /api/sos
    // =========================================================

    @PostMapping
    public ResponseEntity<SOSRequest> createSOS(
            @RequestBody SOSRequest sosRequest) {

        SOSRequest savedSOS =
                sosService.createSOS(
                        sosRequest
                );

        return ResponseEntity.ok(
                savedSOS
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