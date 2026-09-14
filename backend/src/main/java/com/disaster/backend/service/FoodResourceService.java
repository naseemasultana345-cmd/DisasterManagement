package com.disaster.backend.service;

import com.disaster.backend.entity.FoodResource;
import com.disaster.backend.repository.FoodResourceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FoodResourceService {

    private final FoodResourceRepository foodResourceRepository;

    public FoodResourceService(
            FoodResourceRepository foodResourceRepository) {

        this.foodResourceRepository = foodResourceRepository;
    }

    public List<FoodResource> getAllFoodResources() {
        return foodResourceRepository.findAll();
    }

    public List<FoodResource> getAvailableFood() {
        return foodResourceRepository.findByAvailableTrue();
    }

    public FoodResource createFoodResource(FoodResource foodResource) {
        return foodResourceRepository.save(foodResource);
    }
}