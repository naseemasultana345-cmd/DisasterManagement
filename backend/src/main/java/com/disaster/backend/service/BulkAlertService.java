package com.disaster.backend.service;

import com.disaster.backend.dto.UserNotificationDTO;
import com.disaster.backend.entity.DisasterAlert;
import com.disaster.backend.entity.User;
import com.disaster.backend.entity.UserNotification;
import com.disaster.backend.repository.DisasterAlertRepository;
import com.disaster.backend.repository.UserNotificationRepository;
import com.disaster.backend.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class BulkAlertService {

    private final DisasterAlertRepository disasterAlertRepository;
    private final UserRepository userRepository;
    private final UserNotificationRepository userNotificationRepository;

    public BulkAlertService(
            DisasterAlertRepository disasterAlertRepository,
            UserRepository userRepository,
            UserNotificationRepository userNotificationRepository) {

        this.disasterAlertRepository = disasterAlertRepository;
        this.userRepository = userRepository;
        this.userNotificationRepository = userNotificationRepository;
    }

    // =====================================================
    // SEND BULK ALERT TO ALL REGISTERED USERS
    // =====================================================

    public DisasterAlert sendBulkAlert(DisasterAlert alert) {

        DisasterAlert savedAlert =
                disasterAlertRepository.save(alert);

        List<User> users =
                userRepository.findAll();

        for (User user : users) {

            UserNotification notification =
                    new UserNotification(user, savedAlert);

            userNotificationRepository.save(notification);
        }

        return savedAlert;
    }

    // =====================================================
    // GET USER NOTIFICATIONS
    // =====================================================

    public List<UserNotificationDTO> getUserNotifications(Long userId) {

        User user =
                userRepository.findById(userId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "User not found"
                                )
                        );

        List<UserNotification> notifications =
                userNotificationRepository
                        .findByUserOrderByCreatedAtDesc(user);

        List<UserNotificationDTO> result =
                new ArrayList<>();

        for (UserNotification notification : notifications) {

            UserNotificationDTO dto =
                    new UserNotificationDTO(
                            notification.getId(),
                            notification.isReadStatus(),
                            notification.getCreatedAt(),
                            notification.getAlert()
                    );

            result.add(dto);
        }

        return result;
    }

    // =====================================================
    // GET UNREAD COUNT
    // =====================================================

    public long getUnreadCount(Long userId) {

        User user =
                userRepository.findById(userId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "User not found"
                                )
                        );

        return userNotificationRepository
                .countByUserAndReadStatus(
                        user,
                        false
                );
    }
}