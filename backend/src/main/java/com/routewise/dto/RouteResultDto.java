package com.routewise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class RouteResultDto {
    private String algorithm;
    private double distanceKm;
    private double estimatedTimeMinutes;
    private int nodesExplored;
    private List<double[]> routePoints; // [lat, lon]
}
