package com.disaster.backend.repository;

import com.disaster.backend.entity.SOSRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SOSRequestRepository
        extends JpaRepository<SOSRequest, Long> {

    List<SOSRequest> findByStatusOrderByCreatedAtDesc(
            String status
    );
}