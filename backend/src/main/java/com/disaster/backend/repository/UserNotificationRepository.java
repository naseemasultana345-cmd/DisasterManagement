package com.disaster.backend.repository;

import com.disaster.backend.entity.User;
import com.disaster.backend.entity.UserNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserNotificationRepository
        extends JpaRepository<UserNotification, Long> {

    List<UserNotification>
    findByUserOrderByCreatedAtDesc(User user);

    long countByUserAndReadStatus(
            User user,
            boolean readStatus);
}