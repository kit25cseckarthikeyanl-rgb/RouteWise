package com.routewise.algorithm;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * A directed edge between two nodes in the road-network graph.
 * trafficWeight is a simulated multiplier (1.0 = free flow, higher = more congestion)
 * applied to base travel time to approximate real-world traffic conditions.
 */
@Getter
@AllArgsConstructor
public class GraphEdge {
    private final String source;
    private final String destination;
    private final double distanceKm;
    private final double baseTravelTimeMinutes;
    private final double trafficWeight;

    public double getWeightedTravelTime() {
        return baseTravelTimeMinutes * trafficWeight;
    }
}
