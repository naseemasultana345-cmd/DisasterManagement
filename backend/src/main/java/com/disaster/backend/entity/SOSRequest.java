package com.disaster.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "sos_requests")
public class SOSRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private String emergencyType;

    private String status;

    private LocalDateTime createdAt;

    // =========================================================
    // ASSIGNED EMERGENCY SERVICE
    // =========================================================

    private Long assignedServiceId;

    private String assignedServiceName;

    private String assignedServiceType;

    private String assignedServiceAddress;

    private Double assignedServiceLatitude;

    private Double assignedServiceLongitude;

    private Double distanceKm;

    private LocalDateTime assignedAt;


    // =========================================================
    // DEFAULT CONSTRUCTOR
    // =========================================================

    public SOSRequest() {
    }


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public SOSRequest(
            Long userId,
            Double latitude,
            Double longitude,
            String emergencyType,
            String status,
            LocalDateTime createdAt) {

        this.userId = userId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.emergencyType = emergencyType;
        this.status = status;
        this.createdAt = createdAt;
    }


    // =========================================================
    // GETTERS AND SETTERS
    // =========================================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }


    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }


    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }


    public String getEmergencyType() {
        return emergencyType;
    }

    public void setEmergencyType(
            String emergencyType) {

        this.emergencyType =
                emergencyType;
    }


    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(
            LocalDateTime createdAt) {

        this.createdAt =
                createdAt;
    }


    // =========================================================
    // ASSIGNED SERVICE GETTERS AND SETTERS
    // =========================================================

    public Long getAssignedServiceId() {
        return assignedServiceId;
    }

    public void setAssignedServiceId(
            Long assignedServiceId) {

        this.assignedServiceId =
                assignedServiceId;
    }


    public String getAssignedServiceName() {
        return assignedServiceName;
    }

    public void setAssignedServiceName(
            String assignedServiceName) {

        this.assignedServiceName =
                assignedServiceName;
    }


    public String getAssignedServiceType() {
        return assignedServiceType;
    }

    public void setAssignedServiceType(
            String assignedServiceType) {

        this.assignedServiceType =
                assignedServiceType;
    }


    public String getAssignedServiceAddress() {
        return assignedServiceAddress;
    }

    public void setAssignedServiceAddress(
            String assignedServiceAddress) {

        this.assignedServiceAddress =
                assignedServiceAddress;
    }


    public Double getAssignedServiceLatitude() {
        return assignedServiceLatitude;
    }

    public void setAssignedServiceLatitude(
            Double assignedServiceLatitude) {

        this.assignedServiceLatitude =
                assignedServiceLatitude;
    }


    public Double getAssignedServiceLongitude() {
        return assignedServiceLongitude;
    }

    public void setAssignedServiceLongitude(
            Double assignedServiceLongitude) {

        this.assignedServiceLongitude =
                assignedServiceLongitude;
    }


    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(
            Double distanceKm) {

        this.distanceKm =
                distanceKm;
    }


    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(
            LocalDateTime assignedAt) {

        this.assignedAt =
                assignedAt;
    }
}