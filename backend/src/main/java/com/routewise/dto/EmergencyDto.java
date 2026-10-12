package com.routewise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class EmergencyDto {
    private Long id;
    private String requestNumber;
    private Long requesterId;
    private String citizenName;
    private String contactNumber;
    private String emergencyType;
    private String priority;
    private String description;
    private Double latitude;
    private Double longitude;
    private String readableAddress;
    private String landmark;
    private Integer affectedPeopleCount;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Enriched (nullable) dispatch info
    private Long assignedAmbulanceId;
    private String assignedVehicleNumber;
    private Long assignedDriverId;
    private Double etaMinutes;
    private Long selectedHospitalId;
    private String selectedHospitalName;

    // Active offer tracking
    private Long activeOfferId;
    private LocalDateTime offerExpiresAt;
    private Long remainingOfferSeconds;
}
