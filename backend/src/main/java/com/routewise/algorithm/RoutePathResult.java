package com.routewise.algorithm;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class RoutePathResult {
    private final List<GraphNode> path;
    private final double totalDistanceKm;
    private final double totalCost;
    private final double estimatedTimeMinutes;
    private final int nodesExplored;
    private final boolean pathFound;

    public static RoutePathResult noPath(int nodesExplored) {
        return new RoutePathResult(List.of(), 0, 0, 0, nodesExplored, false);
    }
}
