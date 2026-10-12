package com.routewise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class AmbulanceDto {
    private Long id;
    private String vehicleNumber;
    private String responderType;
    private Long driverId;
    private Double latitude;
    private Double longitude;
    private String status;
    private Long currentEmergencyId;
    private LocalDateTime lastUpdated;
}
