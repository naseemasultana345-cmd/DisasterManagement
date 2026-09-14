package com.disaster.backend.service;

import com.disaster.backend.entity.SOSRequest;
import com.disaster.backend.entity.SafeLocation;
import com.disaster.backend.repository.SOSRequestRepository;
import com.disaster.backend.repository.SafeLocationRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class SOSService {

    private final SOSRequestRepository sosRequestRepository;
    private final SafeLocationRepository safeLocationRepository;
    private final SMSService smsService;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public SOSService(
            SOSRequestRepository sosRequestRepository,
            SafeLocationRepository safeLocationRepository,
            SMSService smsService) {

        this.sosRequestRepository = sosRequestRepository;
        this.safeLocationRepository = safeLocationRepository;
        this.smsService = smsService;
    }


    // =========================================================
    // CREATE SOS
    // =========================================================

    public SOSRequest createSOS(SOSRequest sosRequest) {

        // -----------------------------------------------------
        // Validate location
        // -----------------------------------------------------

        if (sosRequest.getLatitude() == null ||
                sosRequest.getLongitude() == null) {

            throw new IllegalArgumentException(
                    "Latitude and longitude are required"
            );
        }


        // -----------------------------------------------------
        // Set default emergency type
        // -----------------------------------------------------

        if (sosRequest.getEmergencyType() == null ||
                sosRequest.getEmergencyType().isBlank()) {

            sosRequest.setEmergencyType(
                    "GENERAL EMERGENCY"
            );
        }


        // -----------------------------------------------------
        // Set default status
        // -----------------------------------------------------

        if (sosRequest.getStatus() == null ||
                sosRequest.getStatus().isBlank()) {

            sosRequest.setStatus("ACTIVE");
        }


        // -----------------------------------------------------
        // Set created time
        // -----------------------------------------------------

        if (sosRequest.getCreatedAt() == null) {

            sosRequest.setCreatedAt(
                    LocalDateTime.now()
            );
        }


        // =====================================================
        // FIND NEAREST EMERGENCY SERVICE
        // =====================================================

        SafeLocation nearestService =
                findNearestEmergencyService(
                        sosRequest.getLatitude(),
                        sosRequest.getLongitude()
                );


        // =====================================================
        // ASSIGN EMERGENCY SERVICE
        // =====================================================

        if (nearestService != null) {

            double distance =
                    calculateDistanceKm(
                            sosRequest.getLatitude(),
                            sosRequest.getLongitude(),
                            nearestService.getLatitude(),
                            nearestService.getLongitude()
                    );


            sosRequest.setAssignedServiceId(
                    nearestService.getId()
            );


            sosRequest.setAssignedServiceName(
                    nearestService.getName()
            );


            sosRequest.setAssignedServiceType(
                    nearestService.getType()
            );


            sosRequest.setAssignedServiceAddress(
                    nearestService.getAddress()
            );


            sosRequest.setAssignedServiceLatitude(
                    nearestService.getLatitude()
            );


            sosRequest.setAssignedServiceLongitude(
                    nearestService.getLongitude()
            );


            // -------------------------------------------------
            // Round distance to 2 decimal places
            // -------------------------------------------------

            double roundedDistance =
                    Math.round(distance * 100.0) / 100.0;


            sosRequest.setDistanceKm(
                    roundedDistance
            );


            sosRequest.setAssignedAt(
                    LocalDateTime.now()
            );
        }


        // =====================================================
        // SAVE SOS
        // =====================================================

        SOSRequest savedSOS =
                sosRequestRepository.save(
                        sosRequest
                );


        // =====================================================
        // SEND SOS SMS TO ADMIN
        // =====================================================
        //
        // IMPORTANT:
        // The SOS is already saved in MySQL.
        //
        // If SMS fails, the SOS will still remain saved.
        //
        // SMSService internally handles SMS errors.
        // =====================================================

        smsService.sendSOSAlert(
                savedSOS.getUserId(),
                savedSOS.getLatitude(),
                savedSOS.getLongitude(),
                savedSOS.getEmergencyType()
        );


        // =====================================================
        // RETURN SAVED SOS
        // =====================================================

        return savedSOS;
    }


    // =========================================================
    // FIND NEAREST EMERGENCY SERVICE
    // =========================================================

    private SafeLocation findNearestEmergencyService(
            double userLatitude,
            double userLongitude) {

        List<SafeLocation> locations =
                safeLocationRepository.findAll();


        SafeLocation nearestPolice = null;

        double nearestPoliceDistance =
                Double.MAX_VALUE;


        SafeLocation nearestEmergencyService = null;

        double nearestEmergencyDistance =
                Double.MAX_VALUE;


        // =====================================================
        // CHECK EVERY SAFE LOCATION
        // =====================================================

        for (SafeLocation location : locations) {

            // -------------------------------------------------
            // Ignore incomplete locations
            // -------------------------------------------------

            if (location.getLatitude() == null ||
                    location.getLongitude() == null ||
                    location.getType() == null) {

                continue;
            }


            String type =
                    location.getType()
                            .trim()
                            .toUpperCase(Locale.ROOT);


            double distance =
                    calculateDistanceKm(
                            userLatitude,
                            userLongitude,
                            location.getLatitude(),
                            location.getLongitude()
                    );


            // =================================================
            // POLICE
            // =================================================

            if (type.equals("POLICE")) {

                if (distance < nearestPoliceDistance) {

                    nearestPolice =
                            location;

                    nearestPoliceDistance =
                            distance;
                }
            }


            // =================================================
            // OTHER EMERGENCY SERVICES
            // =================================================

            if (isEmergencyService(type)) {

                if (distance < nearestEmergencyDistance) {

                    nearestEmergencyService =
                            location;

                    nearestEmergencyDistance =
                            distance;
                }
            }
        }


        // =====================================================
        // FIRST PRIORITY = POLICE
        // =====================================================

        if (nearestPolice != null) {

            return nearestPolice;
        }


        // =====================================================
        // FALLBACK = OTHER EMERGENCY SERVICE
        // =====================================================

        return nearestEmergencyService;
    }


    // =========================================================
    // CHECK EMERGENCY SERVICE TYPE
    // =========================================================

    private boolean isEmergencyService(
            String type) {

        return type.equals("POLICE")
                || type.equals("FIRE")
                || type.equals("FIRE STATION")
                || type.equals("HOSPITAL")
                || type.equals("AMBULANCE")
                || type.equals("EMERGENCY");
    }


    // =========================================================
    // HAVERSINE DISTANCE CALCULATION
    // =========================================================

    private double calculateDistanceKm(
            double latitude1,
            double longitude1,
            double latitude2,
            double longitude2) {

        final double EARTH_RADIUS_KM =
                6371.0;


        double latitudeDifference =
                Math.toRadians(
                        latitude2 - latitude1
                );


        double longitudeDifference =
                Math.toRadians(
                        longitude2 - longitude1
                );


        double a =
                Math.sin(latitudeDifference / 2)
                        * Math.sin(latitudeDifference / 2)
                        +
                        Math.cos(
                                Math.toRadians(latitude1)
                        )
                                * Math.cos(
                                Math.toRadians(latitude2)
                        )
                                *
                                Math.sin(
                                        longitudeDifference / 2
                                )
                                *
                                Math.sin(
                                        longitudeDifference / 2
                                );


        double c =
                2 * Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(1 - a)
                );


        return EARTH_RADIUS_KM * c;
    }


    // =========================================================
    // GET ALL SOS
    // =========================================================

    public List<SOSRequest> getAllSOS() {

        return sosRequestRepository.findAll();
    }


    // =========================================================
    // GET ACTIVE SOS
    // =========================================================

    public List<SOSRequest> getActiveSOS() {

        return sosRequestRepository
                .findByStatusOrderByCreatedAtDesc(
                        "ACTIVE"
                );
    }


    // =========================================================
    // UPDATE SOS STATUS
    // =========================================================

    public SOSRequest updateStatus(
            Long id,
            String status) {

        SOSRequest sosRequest =
                sosRequestRepository
                        .findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "SOS request not found"
                                )
                        );


        sosRequest.setStatus(status);


        return sosRequestRepository.save(
                sosRequest
        );
    }
}