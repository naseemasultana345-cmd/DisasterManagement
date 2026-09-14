package com.disaster.backend.repository;

import com.disaster.backend.entity.SafeLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SafeLocationRepository extends JpaRepository<SafeLocation, Long> {

    List<SafeLocation> findByType(String type);
}