package com.routewise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class RankedAmbulanceDto {
    private Long ambulanceId;
    private String vehicleNumber;
    private double score;
    private double distanceKm;
    private double estimatedResponseTimeMinutes;
    private String trafficCondition;
    private String availability;
    private String selectionReason;
}
