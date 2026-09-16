package com.disaster.backend.controller;

import com.disaster.backend.entity.DisasterAlert;
import com.disaster.backend.service.DisasterAlertService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disaster-alert")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://disaster-management-pink-seven.vercel.app"
})
public class DisasterAlertController {

    private final DisasterAlertService disasterAlertService;

    public DisasterAlertController(
            DisasterAlertService disasterAlertService) {

        this.disasterAlertService =
                disasterAlertService;
    }

    // Create a new disaster alert
    @PostMapping
    public DisasterAlert createAlert(
            @RequestBody DisasterAlert alert) {

        return disasterAlertService.createAlert(alert);
    }

    // Get all disaster alerts
    @GetMapping
    public List<DisasterAlert> getAllAlerts() {

        return disasterAlertService.getAllAlerts();
    }

    // Get latest disaster alert
    @GetMapping("/latest")
    public DisasterAlert getLatestAlert() {

        return disasterAlertService.getLatestAlert();
    }

    // Delete disaster alert
    @DeleteMapping("/{id}")
    public void deleteAlert(
            @PathVariable Long id) {

        disasterAlertService.deleteAlert(id);
    }
}