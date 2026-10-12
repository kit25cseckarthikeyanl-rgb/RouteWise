package com.routewise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class EmergencyOfferDto {
    private Long id;
    private Long emergencyId;
    private String emergencyRequestNumber;
    private String emergencyType;
    private String priority;
    private String description;
    private String citizenName;
    private String contactNumber;
    private Double latitude;
    private Double longitude;
    private String readableAddress;
    private String landmark;
    private Integer affectedPeopleCount;
    private LocalDateTime emergencyCreatedAt;
    private Long elapsedSeconds;

    // Dispatch metrics
    private String responderType;
    private Long responderId;
    private String responderVehicleNumber;
    private Double distanceKm;
    private Double etaMinutes;

    // Offer lifecycle & countdown
    private String status;
    private LocalDateTime offeredAt;
    private LocalDateTime expiresAt;
    private Long timeoutSeconds;
    private Long remainingSeconds;
    private String declineReason;
}
