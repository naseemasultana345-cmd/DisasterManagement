package com.disaster.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "food_resources")
public class FoodResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String locationName;

    private String address;

    private String foodType;

    private Integer quantity;

    private Double latitude;

    private Double longitude;

    private boolean available;

    public FoodResource() {
    }

    public FoodResource(String locationName, String address,
                        String foodType, Integer quantity,
                        Double latitude, Double longitude,
                        boolean available) {

        this.locationName = locationName;
        this.address = address;
        this.foodType = foodType;
        this.quantity = quantity;
        this.latitude = latitude;
        this.longitude = longitude;
        this.available = available;
    }

    public Long getId() {
        return id;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getFoodType() {
        return foodType;
    }

    public void setFoodType(String foodType) {
        this.foodType = foodType;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
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

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }
}