package com.disaster.backend.controller;

import com.disaster.backend.entity.FoodResource;
import com.disaster.backend.service.FoodResourceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/food")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://disaster-management-pink-seven.vercel.app"
})
public class FoodResourceController {

    private final FoodResourceService foodResourceService;

    public FoodResourceController(
            FoodResourceService foodResourceService) {

        this.foodResourceService = foodResourceService;
    }

    @GetMapping
    public ResponseEntity<List<FoodResource>> getAllFood() {

        return ResponseEntity.ok(
                foodResourceService.getAllFoodResources()
        );
    }

    @GetMapping("/available")
    public ResponseEntity<List<FoodResource>> getAvailableFood() {

        return ResponseEntity.ok(
                foodResourceService.getAvailableFood()
        );
    }

    @PostMapping
    public ResponseEntity<FoodResource> createFood(
            @RequestBody FoodResource foodResource) {

        return ResponseEntity.ok(
                foodResourceService.createFoodResource(foodResource)
        );
    }
}