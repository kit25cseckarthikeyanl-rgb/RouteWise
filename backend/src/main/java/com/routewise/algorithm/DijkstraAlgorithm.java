package com.routewise.algorithm;

import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Dijkstra's shortest-path algorithm over the synthetic road-network graph.
 * Cost function is weighted travel time (distance and simulated traffic
 * conditions both factor into edge weight via GraphEdge.getWeightedTravelTime()).
 */
@Component
public class DijkstraAlgorithm {

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

        Map<String, Double> costSoFar = new HashMap<>();
        Map<String, Double> distanceSoFar = new HashMap<>();
        Map<String, String> cameFrom = new HashMap<>();
        Set<String> visited = new HashSet<>();
        int nodesExplored = 0;

        PriorityQueue<String> queue = new PriorityQueue<>(Comparator.comparingDouble(id -> costSoFar.getOrDefault(id, Double.MAX_VALUE)));

        costSoFar.put(sourceId, 0.0);
        distanceSoFar.put(sourceId, 0.0);
        queue.add(sourceId);

        while (!queue.isEmpty()) {
            String current = queue.poll();
            if (visited.contains(current)) continue;
            visited.add(current);
            nodesExplored++;

            if (current.equals(destinationId)) break;

            for (GraphEdge edge : graph.getEdges(current)) {
                if (visited.contains(edge.getDestination())) continue;
                double newCost = costSoFar.get(current) + edge.getWeightedTravelTime();
                double newDistance = distanceSoFar.get(current) + edge.getDistanceKm();

                if (newCost < costSoFar.getOrDefault(edge.getDestination(), Double.MAX_VALUE)) {
                    costSoFar.put(edge.getDestination(), newCost);
                    distanceSoFar.put(edge.getDestination(), newDistance);
                    cameFrom.put(edge.getDestination(), current);
                    queue.add(edge.getDestination());
                }
            }
        }

        if (!cameFrom.containsKey(destinationId) && !sourceId.equals(destinationId)) {
            return RoutePathResult.noPath(nodesExplored);
        }

        List<GraphNode> path = reconstructPath(graph, cameFrom, sourceId, destinationId);
        double totalCost = costSoFar.getOrDefault(destinationId, 0.0);
        double totalDistance = distanceSoFar.getOrDefault(destinationId, 0.0);

        return new RoutePathResult(path, totalDistance, totalCost, totalCost, nodesExplored, true);
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
