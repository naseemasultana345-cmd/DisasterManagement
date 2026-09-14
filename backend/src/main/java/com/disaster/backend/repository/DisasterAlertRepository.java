package com.disaster.backend.repository;

import com.disaster.backend.entity.DisasterAlert;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisasterAlertRepository
        extends JpaRepository<DisasterAlert, Long> {

    List<DisasterAlert> findAllByOrderByCreatedAtDesc();

    boolean existsByDisasterTypeAndActive(
            String disasterType,
            boolean active
    );
}