package com.routewise.algorithm;

import org.springframework.stereotype.Component;

import java.util.*;

/**
 * A* shortest-path algorithm over the synthetic road-network graph.
 *
 * f(n) = g(n) + h(n)
 * g(n) = actual weighted travel-time cost accumulated so far
 * h(n) = admissible heuristic: straight-line (haversine) distance to the
 *        destination converted to an optimistic travel-time estimate
 *        (assumes best-case free-flow speed), so it never overestimates
 *        the true remaining cost.
 */
@Component
public class AStarAlgorithm {

    // Optimistic free-flow speed assumption used only for the heuristic (km/min)
    private static final double OPTIMISTIC_SPEED_KM_PER_MIN = 1.0; // 60 km/h

    public RoutePathResult findShortestPath(Graph graph, String sourceId, String destinationId) {
        if (graph == null || graph.isEmpty()) {
            return RoutePathResult.noPath(0);
        }
        if (!graph.hasNode(sourceId) || !graph.hasNode(destinationId)) {
            return RoutePathResult.noPath(0);
        }
        if (sourceId.equals(destinationId)) {
            GraphNode single = graph.getNode(sourceId);
            return new RoutePathResult(List.of(single), 0, 0, 0, 1, true);
        }

        GraphNode goal = graph.getNode(destinationId);

        Map<String, Double> gScore = new HashMap<>();
        Map<String, Double> distanceSoFar = new HashMap<>();
        Map<String, String> cameFrom = new HashMap<>();
        Set<String> visited = new HashSet<>();
        int nodesExplored = 0;

        PriorityQueue<String> openSet = new PriorityQueue<>(
                Comparator.comparingDouble(id -> gScore.getOrDefault(id, Double.MAX_VALUE) + heuristic(graph.getNode(id), goal))
        );

        gScore.put(sourceId, 0.0);
        distanceSoFar.put(sourceId, 0.0);
        openSet.add(sourceId);

        while (!openSet.isEmpty()) {
            String current = openSet.poll();
            if (visited.contains(current)) continue;
            visited.add(current);
            nodesExplored++;

            if (current.equals(destinationId)) break;

            for (GraphEdge edge : graph.getEdges(current)) {
                if (visited.contains(edge.getDestination())) continue;
                double tentativeG = gScore.get(current) + edge.getWeightedTravelTime();
                double newDistance = distanceSoFar.get(current) + edge.getDistanceKm();

                if (tentativeG < gScore.getOrDefault(edge.getDestination(), Double.MAX_VALUE)) {
                    gScore.put(edge.getDestination(), tentativeG);
                    distanceSoFar.put(edge.getDestination(), newDistance);
                    cameFrom.put(edge.getDestination(), current);
                    openSet.add(edge.getDestination());
                }
            }
        }

        if (!cameFrom.containsKey(destinationId) && !sourceId.equals(destinationId)) {
            return RoutePathResult.noPath(nodesExplored);
        }

        List<GraphNode> path = reconstructPath(graph, cameFrom, sourceId, destinationId);
        double totalCost = gScore.getOrDefault(destinationId, 0.0);
        double totalDistance = distanceSoFar.getOrDefault(destinationId, 0.0);

        return new RoutePathResult(path, totalDistance, totalCost, totalCost, nodesExplored, true);
    }

    /** Admissible heuristic: haversine distance converted to an optimistic time estimate. */
    private double heuristic(GraphNode from, GraphNode to) {
        double distanceKm = haversineKm(from.getLatitude(), from.getLongitude(), to.getLatitude(), to.getLongitude());
        return distanceKm / OPTIMISTIC_SPEED_KM_PER_MIN;
    }

    public static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private List<GraphNode> reconstructPath(Graph graph, Map<String, String> cameFrom, String sourceId, String destinationId) {
        LinkedList<GraphNode> path = new LinkedList<>();
        String current = destinationId;
        path.addFirst(graph.getNode(current));
        while (!current.equals(sourceId)) {
            current = cameFrom.get(current);
            if (current == null) break;
            path.addFirst(graph.getNode(current));
        }
        return path;
    }
}
