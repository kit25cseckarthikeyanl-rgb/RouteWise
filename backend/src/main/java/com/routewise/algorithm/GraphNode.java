package com.routewise.algorithm;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * A node in the synthetic road-network graph used for route optimization.
 * Coordinates represent simulated GPS positions for the academic prototype.
 */
@Getter
@AllArgsConstructor
public class GraphNode {
    private final String id;
    private final double latitude;
    private final double longitude;
}
