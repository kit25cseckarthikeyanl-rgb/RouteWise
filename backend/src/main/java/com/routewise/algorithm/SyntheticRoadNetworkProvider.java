package com.routewise.algorithm;

import org.springframework.stereotype.Component;

/**
 * Builds a synthetic (simulated) road-network graph for the academic prototype.
 * Given a source and destination GPS point, this generates a small set of
 * intermediate "road" nodes between them with simulated distances and
 * traffic weights, so Dijkstra/A* have a non-trivial graph to search.
 *
 * DISCLAIMER: This does NOT call any real map/routing provider. It is a
 * deterministic simulation used purely to demonstrate the algorithms.
 */
@Component
public class SyntheticRoadNetworkProvider {

    private static final int INTERMEDIATE_NODES = 4;

    public Graph buildGraphBetween(double srcLat, double srcLon, double destLat, double destLon, double simulatedTrafficFactor) {
        Graph graph = new Graph();

        GraphNode source = new GraphNode("N0", srcLat, srcLon);
        graph.addNode(source);

        String previousId = "N0";
        double prevLat = srcLat;
        double prevLon = srcLon;

        for (int i = 1; i <= INTERMEDIATE_NODES; i++) {
            double t = (double) i / (INTERMEDIATE_NODES + 1);
            // Linear interpolation with a small deterministic jitter to simulate a real road path
            double jitter = Math.sin(i * 1.37) * 0.001;
            double lat = srcLat + (destLat - srcLat) * t + jitter;
            double lon = srcLon + (destLon - srcLon) * t + jitter;

            String nodeId = "N" + i;
            GraphNode node = new GraphNode(nodeId, lat, lon);
            graph.addNode(node);

            double segmentDistance = AStarAlgorithm.haversineKm(prevLat, prevLon, lat, lon);
            double baseTimeMin = segmentDistance / 0.7; // simulated avg city speed ~42 km/h
            double trafficWeight = simulatedTrafficFactor;

            graph.addBidirectionalEdge(previousId, nodeId, segmentDistance, baseTimeMin, trafficWeight);

            previousId = nodeId;
            prevLat = lat;
            prevLon = lon;
        }

        String destId = "N" + (INTERMEDIATE_NODES + 1);
        GraphNode destination = new GraphNode(destId, destLat, destLon);
        graph.addNode(destination);

        double segmentDistance = AStarAlgorithm.haversineKm(prevLat, prevLon, destLat, destLon);
        double baseTimeMin = segmentDistance / 0.7;
        graph.addBidirectionalEdge(previousId, destId, segmentDistance, baseTimeMin, simulatedTrafficFactor);

        return graph;
    }

    public String getSourceNodeId() {
        return "N0";
    }

    public String getDestinationNodeId() {
        return "N" + (INTERMEDIATE_NODES + 1);
    }
}
