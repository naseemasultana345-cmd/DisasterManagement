package com.disaster.backend.repository;

import com.disaster.backend.entity.FoodResource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FoodResourceRepository
        extends JpaRepository<FoodResource, Long> {

    List<FoodResource> findByAvailableTrue();
}