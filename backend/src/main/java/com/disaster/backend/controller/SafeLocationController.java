package com.disaster.backend.controller;

import com.disaster.backend.entity.SafeLocation;
import com.disaster.backend.service.SafeLocationService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/safe-locations")
@CrossOrigin(origins = "http://localhost:5173")
public class SafeLocationController {

    private final SafeLocationService safeLocationService;

    public SafeLocationController(
            SafeLocationService safeLocationService) {

        this.safeLocationService = safeLocationService;
    }

    // =========================================
    // GET ALL SAFE LOCATIONS
    // =========================================

    @GetMapping
    public ResponseEntity<List<SafeLocation>> getAllLocations() {

        return ResponseEntity.ok(
                safeLocationService.getAllLocations()
        );
    }

    // =========================================
    // GET LOCATIONS BY TYPE
    // =========================================

    @GetMapping("/type/{type}")
    public ResponseEntity<List<SafeLocation>> getLocationsByType(
            @PathVariable String type) {

        return ResponseEntity.ok(
                safeLocationService.getLocationsByType(type)
        );
    }

    // =========================================
    // FIND ONE SAFEST LOCATION
    // =========================================

    @GetMapping("/safest")
    public ResponseEntity<SafeLocation> getSafestLocation(

            @RequestParam double latitude,

            @RequestParam double longitude,

            @RequestParam(required = false)
            String disasterType) {

        SafeLocation safest =
                safeLocationService.findSafestLocation(
                        latitude,
                        longitude,
                        disasterType
                );

        if (safest == null) {
            return ResponseEntity
                    .notFound()
                    .build();
        }

        return ResponseEntity.ok(safest);
    }

    // =========================================
    // FIND MULTIPLE SAFEST LOCATIONS
    // =========================================

    @GetMapping("/safest-list")
    public ResponseEntity<List<SafeLocation>> getSafestLocations(

            @RequestParam double latitude,

            @RequestParam double longitude,

            @RequestParam(required = false)
            String disasterType) {

        List<SafeLocation> safestLocations =
                safeLocationService.findSafestLocations(
                        latitude,
                        longitude,
                        disasterType
                );

        if (safestLocations.isEmpty()) {
            return ResponseEntity
                    .notFound()
                    .build();
        }

        return ResponseEntity.ok(safestLocations);
    }

    // =========================================
    // ADD SAFE LOCATION
    // =========================================

    @PostMapping
    public ResponseEntity<SafeLocation> addLocation(
            @RequestBody SafeLocation location) {

        return ResponseEntity.ok(
                safeLocationService.addLocation(location)
        );
    }
}