
package com.disaster.backend.controller;

import com.disaster.backend.entity.Alert;
import com.disaster.backend.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://disaster-management-pink-seven.vercel.app"
})
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public ResponseEntity<List<Alert>> getAllAlerts() {
        return ResponseEntity.ok(
                alertService.getAllAlerts()
        );
    }

    @GetMapping("/active")
    public ResponseEntity<List<Alert>> getActiveAlerts() {
        return ResponseEntity.ok(
                alertService.getActiveAlerts()
        );
    }

    @PostMapping
    public ResponseEntity<Alert> createAlert(
            @RequestBody Alert alert
    ) {
        return ResponseEntity.ok(
                alertService.createAlert(alert)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteAlert(
            @PathVariable Long id
    ) {
        alertService.deleteAlert(id);

        return ResponseEntity.ok(
                "Alert deleted successfully"
        );
    }
}
