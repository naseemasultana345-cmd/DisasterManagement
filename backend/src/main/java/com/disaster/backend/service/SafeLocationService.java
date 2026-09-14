package com.disaster.backend.service;

import com.disaster.backend.entity.SafeLocation;
import com.disaster.backend.repository.SafeLocationRepository;

import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class SafeLocationService {

    private final SafeLocationRepository safeLocationRepository;

    public SafeLocationService(SafeLocationRepository safeLocationRepository) {
        this.safeLocationRepository = safeLocationRepository;
    }

    // =========================================
    // GET ALL SAFE LOCATIONS
    // =========================================

    public List<SafeLocation> getAllLocations() {
        return safeLocationRepository.findAll();
    }

    // =========================================
    // GET LOCATIONS BY TYPE
    // =========================================

    public List<SafeLocation> getLocationsByType(String type) {
        return safeLocationRepository.findByType(type);
    }

    // =========================================
    // ADD SAFE LOCATION
    // =========================================

    public SafeLocation addLocation(SafeLocation location) {
        return safeLocationRepository.save(location);
    }

    // =========================================
    // FIND SAFEST LOCATION
    // =========================================

    public SafeLocation findSafestLocation(
            double userLatitude,
            double userLongitude,
            String disasterType) {

        List<SafeLocation> locations =
                safeLocationRepository.findAll();

        if (locations.isEmpty()) {
            return null;
        }

        // Find locations within 10 KM
        List<SafeLocation> nearbyLocations = locations.stream()
                .filter(location ->
                        location.getLatitude() != null
                                && location.getLongitude() != null)
                .filter(location -> {

                    double distance = calculateDistance(
                            userLatitude,
                            userLongitude,
                            location.getLatitude(),
                            location.getLongitude()
                    );

                    return distance <= 10.0;
                })
                .toList();

        if (nearbyLocations.isEmpty()) {
            return null;
        }

        // =========================================
        // HEAVY RAIN
        // Higher elevation is safer
        // =========================================

        if (disasterType != null
                && disasterType.equalsIgnoreCase("Heavy Rain")) {

            return nearbyLocations.stream()
                    .min(
                            Comparator.comparingDouble(
                                    (SafeLocation location) ->
                                            -getElevation(location)
                            ).thenComparingDouble(
                                    (SafeLocation location) ->
                                            calculateDistance(
                                                    userLatitude,
                                                    userLongitude,
                                                    location.getLatitude(),
                                                    location.getLongitude()
                                            )
                            )
                    )
                    .orElse(null);
        }

        // =========================================
        // EXTREME HEAT
        // =========================================

        if (disasterType != null
                && disasterType.equalsIgnoreCase("Extreme Heat")) {

            return nearbyLocations.stream()
                    .max(
                            Comparator.comparingInt(
                                    (SafeLocation location) ->
                                            heatSafetyScore(location)
                            )
                    )
                    .orElse(null);
        }

        // =========================================
        // NORMAL / UNKNOWN DISASTER
        // Nearest location
        // =========================================

        return nearbyLocations.stream()
                .min(
                        Comparator.comparingDouble(
                                (SafeLocation location) ->
                                        calculateDistance(
                                                userLatitude,
                                                userLongitude,
                                                location.getLatitude(),
                                                location.getLongitude()
                                        )
                        )
                )
                .orElse(null);
    }
// =========================================
// FIND MULTIPLE SAFEST LOCATIONS
// =========================================

public List<SafeLocation> findSafestLocations(
        double userLatitude,
        double userLongitude,
        String disasterType) {

    List<SafeLocation> locations =
            safeLocationRepository.findAll();

    if (locations.isEmpty()) {
        return List.of();
    }

    // Find locations within 10 KM
    List<SafeLocation> nearbyLocations =
            locations.stream()
                    .filter(location ->
                            location.getLatitude() != null
                                    && location.getLongitude() != null)
                    .filter(location -> {

                        double distance =
                                calculateDistance(
                                        userLatitude,
                                        userLongitude,
                                        location.getLatitude(),
                                        location.getLongitude()
                                );

                        return distance <= 10.0;
                    })
                    .toList();

    if (nearbyLocations.isEmpty()) {
        return List.of();
    }

    // =========================================
    // HEAVY RAIN
    // Higher elevation is safer
    // =========================================

    if (disasterType != null
            && disasterType.equalsIgnoreCase("Heavy Rain")) {

        return nearbyLocations.stream()
                .sorted(
                        Comparator
                                .comparingDouble(
                                        (SafeLocation location) ->
                                                -getElevation(location)
                                )
                                .thenComparingDouble(
                                        (SafeLocation location) ->
                                                calculateDistance(
                                                        userLatitude,
                                                        userLongitude,
                                                        location.getLatitude(),
                                                        location.getLongitude()
                                                )
                                )
                )
                .limit(5)
                .toList();
    }

    // =========================================
    // EXTREME HEAT
    // =========================================

    if (disasterType != null
            && disasterType.equalsIgnoreCase("Extreme Heat")) {

        return nearbyLocations.stream()
                .sorted(
                        Comparator
                                .comparingInt(
                                        (SafeLocation location) ->
                                                heatSafetyScore(location)
                                )
                                .reversed()
                                .thenComparingDouble(
                                        (SafeLocation location) ->
                                                calculateDistance(
                                                        userLatitude,
                                                        userLongitude,
                                                        location.getLatitude(),
                                                        location.getLongitude()
                                                )
                                )
                )
                .limit(5)
                .toList();
    }

    // =========================================
    // NORMAL / UNKNOWN DISASTER
    // Nearest locations
    // =========================================

    return nearbyLocations.stream()
            .sorted(
                    Comparator.comparingDouble(
                            (SafeLocation location) ->
                                    calculateDistance(
                                            userLatitude,
                                            userLongitude,
                                            location.getLatitude(),
                                            location.getLongitude()
                                    )
                    )
            )
            .limit(5)
            .toList();
}
    // =========================================
    // GET ELEVATION
    // =========================================

    private double getElevation(SafeLocation location) {

        if (location.getElevation() == null) {
            return 0.0;
        }

        return location.getElevation();
    }

    // =========================================
    // HEAT SAFETY SCORE
    // =========================================

    private int heatSafetyScore(SafeLocation location) {

        String type = location.getType();

        if (type == null) {
            return 0;
        }

        type = type.toLowerCase();

        if (type.contains("hospital")) {
            return 100;
        }

        if (type.contains("shelter")) {
            return 90;
        }

        if (type.contains("school")) {
            return 80;
        }

        if (type.contains("community")) {
            return 80;
        }

        if (type.contains("building")) {
            return 70;
        }

        return 50;
    }

    // =========================================
    // DISTANCE CALCULATION
    // =========================================

    private double calculateDistance(
            double lat1,
            double lon1,
            double lat2,
            double lon2) {

        double earthRadius = 6371.0;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2)
                        * Math.sin(dLon / 2);

        double c =
                2 * Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(1 - a)
                );

        return earthRadius * c;
    }
}