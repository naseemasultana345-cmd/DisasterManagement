package com.disaster.backend.repository;

import com.disaster.backend.entity.Shelter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShelterRepository extends JpaRepository<Shelter, Long> {

    List<Shelter> findByFloodSafeTrue();

    List<Shelter> findByTypeIgnoreCase(String type);
}