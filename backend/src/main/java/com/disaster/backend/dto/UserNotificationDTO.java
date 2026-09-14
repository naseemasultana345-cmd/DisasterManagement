package com.disaster.backend.dto;

import com.disaster.backend.entity.DisasterAlert;
import java.time.LocalDateTime;

public class UserNotificationDTO {

    private Long id;
    private boolean readStatus;
    private LocalDateTime createdAt;
    private DisasterAlert alert;

    public UserNotificationDTO() {
    }

    public UserNotificationDTO(
            Long id,
            boolean readStatus,
            LocalDateTime createdAt,
            DisasterAlert alert) {

        this.id = id;
        this.readStatus = readStatus;
        this.createdAt = createdAt;
        this.alert = alert;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public boolean isReadStatus() {
        return readStatus;
    }

    public void setReadStatus(boolean readStatus) {
        this.readStatus = readStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public DisasterAlert getAlert() {
        return alert;
    }

    public void setAlert(DisasterAlert alert) {
        this.alert = alert;
    }
}