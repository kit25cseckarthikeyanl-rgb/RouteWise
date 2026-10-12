package com.routewise.algorithm;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AStarAlgorithmTest {

    private final AStarAlgorithm aStar = new AStarAlgorithm();

    private Graph simpleGraph() {
        Graph g = new Graph();
        g.addNode(new GraphNode("A", 0, 0));
        g.addNode(new GraphNode("B", 0, 0.01));
        g.addNode(new GraphNode("C", 0.01, 0.01));
        g.addNode(new GraphNode("D", 0.01, 0));
        g.addBidirectionalEdge("A", "B", 1, 1, 1.0);
        g.addBidirectionalEdge("B", "D", 1, 1, 1.0);
        g.addBidirectionalEdge("A", "C", 5, 5, 1.0);
        g.addBidirectionalEdge("C", "D", 5, 5, 1.0);
        return g;
    }

    @Test
    void findsShortestPathAmongMultipleRoutes() {
        RoutePathResult result = aStar.findShortestPath(simpleGraph(), "A", "D");
        assertTrue(result.isPathFound());
        assertEquals(3, result.getPath().size());
    }

    @Test
    void sameSourceAndDestination() {
        RoutePathResult result = aStar.findShortestPath(simpleGraph(), "A", "A");
        assertTrue(result.isPathFound());
        assertEquals(1, result.getPath().size());
    }

    @Test
    void unreachableDestinationReturnsNoPath() {
        Graph g = new Graph();
        g.addNode(new GraphNode("A", 0, 0));
        g.addNode(new GraphNode("Z", 5, 5));
        RoutePathResult result = aStar.findShortestPath(g, "A", "Z");
        assertFalse(result.isPathFound());
    }

    @Test
    void emptyGraphReturnsNoPath() {
        RoutePathResult result = aStar.findShortestPath(new Graph(), "A", "B");
        assertFalse(result.isPathFound());
    }

    @Test
    void haversineDistanceIsPositiveForDistinctPoints() {
        double d = AStarAlgorithm.haversineKm(0, 0, 0, 1);
        assertTrue(d > 0);
    }
}
