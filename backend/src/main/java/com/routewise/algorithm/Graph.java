package com.routewise.algorithm;

import java.util.*;

/**
 * Simple weighted directed graph, represented with adjacency lists.
 * Used to model a synthetic (simulated) road network for the RouteWise
 * academic prototype. This is NOT connected to any live map/traffic
 * provider - all distances/traffic weights are simulated.
 */
public class Graph {

    private final Map<String, GraphNode> nodes = new HashMap<>();
    private final Map<String, List<GraphEdge>> adjacency = new HashMap<>();

    public void addNode(GraphNode node) {
        nodes.put(node.getId(), node);
        adjacency.putIfAbsent(node.getId(), new ArrayList<>());
    }

    public void addEdge(GraphEdge edge) {
        adjacency.putIfAbsent(edge.getSource(), new ArrayList<>());
        adjacency.putIfAbsent(edge.getDestination(), new ArrayList<>());
        adjacency.get(edge.getSource()).add(edge);
    }

    /** Adds edges in both directions with identical weights (undirected road segment). */
    public void addBidirectionalEdge(String a, String b, double distanceKm, double baseTimeMin, double trafficWeight) {
        addEdge(new GraphEdge(a, b, distanceKm, baseTimeMin, trafficWeight));
        addEdge(new GraphEdge(b, a, distanceKm, baseTimeMin, trafficWeight));
    }

    public GraphNode getNode(String id) {
        return nodes.get(id);
    }

    public boolean hasNode(String id) {
        return nodes.containsKey(id);
    }

    public List<GraphEdge> getEdges(String nodeId) {
        return adjacency.getOrDefault(nodeId, Collections.emptyList());
    }

    public Collection<GraphNode> getAllNodes() {
        return nodes.values();
    }

    public boolean isEmpty() {
        return nodes.isEmpty();
    }
}
