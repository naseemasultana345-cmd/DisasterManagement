package com.disaster.backend.service;

import com.disaster.backend.entity.DisasterAlert;
import com.disaster.backend.repository.DisasterAlertRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DisasterAlertService {

    private final DisasterAlertRepository disasterAlertRepository;

    public DisasterAlertService(
            DisasterAlertRepository disasterAlertRepository) {

        this.disasterAlertRepository =
                disasterAlertRepository;
    }

    // =========================================
    // CREATE ALERT
    // =========================================

    public DisasterAlert createAlert(
            DisasterAlert alert) {

        return disasterAlertRepository.save(alert);
    }


    // =========================================
    // GET ALL ALERTS
    // =========================================

    public List<DisasterAlert> getAllAlerts() {

        return disasterAlertRepository
                .findAllByOrderByCreatedAtDesc();
    }


    // =========================================
    // GET LATEST ALERT
    // =========================================

    public DisasterAlert getLatestAlert() {

        List<DisasterAlert> alerts =
                disasterAlertRepository
                        .findAllByOrderByCreatedAtDesc();

        if (alerts.isEmpty()) {
            return null;
        }

        return alerts.get(0);
    }


    // =========================================
    // CHECK ACTIVE ALERT
    // =========================================

    public boolean activeAlertExists(
            String disasterType) {

        return disasterAlertRepository
                .existsByDisasterTypeAndActive(
                        disasterType,
                        true
                );
    }


    // =========================================
    // DELETE ALERT
    // =========================================

    public void deleteAlert(Long id) {

        disasterAlertRepository.deleteById(id);
    }
}