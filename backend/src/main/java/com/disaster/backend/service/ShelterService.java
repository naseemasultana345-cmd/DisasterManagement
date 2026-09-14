package com.disaster.backend.service;

import com.disaster.backend.entity.Shelter;
import com.disaster.backend.repository.ShelterRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ShelterService {

    private final ShelterRepository shelterRepository;

    public ShelterService(ShelterRepository shelterRepository) {
        this.shelterRepository = shelterRepository;
    }

    public List<Shelter> getAllShelters() {
        return shelterRepository.findAll();
    }

    public List<Shelter> getFloodSafeShelters() {
        return shelterRepository.findByFloodSafeTrue();
    }

    public Shelter createShelter(Shelter shelter) {
        return shelterRepository.save(shelter);
    }
}