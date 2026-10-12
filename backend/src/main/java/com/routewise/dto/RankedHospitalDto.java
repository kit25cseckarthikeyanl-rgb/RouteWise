package com.routewise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class RankedHospitalDto {
    private Long hospitalId;
    private String name;
    private double distanceKm;
    private double etaMinutes;
    private boolean emergencyCapability;
    private boolean icuAvailable;
    private int bedsAvailable;
    private double score;
    private String selectionReason;
}
