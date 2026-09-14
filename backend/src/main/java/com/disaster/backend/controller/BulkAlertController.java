package com.disaster.backend.controller;

import com.disaster.backend.dto.UserNotificationDTO;
import com.disaster.backend.entity.DisasterAlert;
import com.disaster.backend.service.BulkAlertService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bulk-alert")
@CrossOrigin(origins = "http://localhost:5173")
public class BulkAlertController {

    private final BulkAlertService bulkAlertService;

    public BulkAlertController(
            BulkAlertService bulkAlertService) {

        this.bulkAlertService = bulkAlertService;
    }

    // =====================================================
    // BROADCAST ALERT
    // =====================================================

    @PostMapping("/broadcast")
    public DisasterAlert broadcastAlert(
            @RequestBody DisasterAlert alert) {

        return bulkAlertService.sendBulkAlert(alert);
    }

    // =====================================================
    // GET USER NOTIFICATIONS
    // =====================================================

    @GetMapping("/user/{userId}")
    public List<UserNotificationDTO> getUserNotifications(
            @PathVariable Long userId) {

        return bulkAlertService
                .getUserNotifications(userId);
    }

    // =====================================================
    // GET UNREAD COUNT
    // =====================================================

    @GetMapping("/user/{userId}/unread-count")
    public long getUnreadCount(
            @PathVariable Long userId) {

        return bulkAlertService
                .getUnreadCount(userId);
    }
}