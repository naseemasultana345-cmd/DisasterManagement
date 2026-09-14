package com.disaster.backend.repository;

import com.disaster.backend.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByActiveTrue();

    List<Alert> findByTypeIgnoreCase(String type);
}