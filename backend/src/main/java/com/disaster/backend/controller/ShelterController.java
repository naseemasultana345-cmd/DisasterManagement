package com.disaster.backend.controller;

import com.disaster.backend.entity.Shelter;
import com.disaster.backend.service.ShelterService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shelters")
@CrossOrigin(origins = "http://localhost:5173")
public class ShelterController {

    private final ShelterService shelterService;

    public ShelterController(ShelterService shelterService) {
        this.shelterService = shelterService;
    }

    @GetMapping
    public ResponseEntity<List<Shelter>> getAllShelters() {

        return ResponseEntity.ok(
                shelterService.getAllShelters()
        );
    }

    @GetMapping("/flood-safe")
    public ResponseEntity<List<Shelter>> getFloodSafeShelters() {

        return ResponseEntity.ok(
                shelterService.getFloodSafeShelters()
        );
    }

    @PostMapping
    public ResponseEntity<Shelter> createShelter(
            @RequestBody Shelter shelter) {

        return ResponseEntity.ok(
                shelterService.createShelter(shelter)
        );
    }
}