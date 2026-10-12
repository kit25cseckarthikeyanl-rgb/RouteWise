package com.routewise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class DashboardSummaryDto {
    private long totalAmbulances;
    private long availableAmbulances;
    private long busyAmbulances;
    private long offlineAmbulances;
    private long activeEmergencies;
    private long criticalEmergencies;
    private long hospitalsAvailable;
    private long completedToday;
}
