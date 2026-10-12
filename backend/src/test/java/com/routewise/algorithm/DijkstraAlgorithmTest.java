package com.routewise.algorithm;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DijkstraAlgorithmTest {

    private final DijkstraAlgorithm dijkstra = new DijkstraAlgorithm();

    private Graph simpleGraph() {
        Graph g = new Graph();
        g.addNode(new GraphNode("A", 0, 0));
        g.addNode(new GraphNode("B", 0, 1));
        g.addNode(new GraphNode("C", 1, 1));
        g.addNode(new GraphNode("D", 1, 0));
        // A -> B -> D (short path), A -> C -> D (long path)
        g.addBidirectionalEdge("A", "B", 1, 1, 1.0);
        g.addBidirectionalEdge("B", "D", 1, 1, 1.0);
        g.addBidirectionalEdge("A", "C", 5, 5, 1.0);
        g.addBidirectionalEdge("C", "D", 5, 5, 1.0);
        return g;
    }

    @Test
    void findsShortestPathAmongMultipleRoutes() {
        RoutePathResult result = dijkstra.findShortestPath(simpleGraph(), "A", "D");
        assertTrue(result.isPathFound());
        assertEquals(3, result.getPath().size()); // A, B, D
        assertEquals("B", result.getPath().get(1).getId());
    }

    @Test
    void sameSourceAndDestinationReturnsTrivialPath() {
        RoutePathResult result = dijkstra.findShortestPath(simpleGraph(), "A", "A");
        assertTrue(result.isPathFound());
        assertEquals(1, result.getPath().size());
        assertEquals(0, result.getTotalDistanceKm());
    }

    @Test
    void unreachableDestinationReturnsNoPath() {
        Graph g = new Graph();
        g.addNode(new GraphNode("A", 0, 0));
        g.addNode(new GraphNode("Z", 5, 5)); // isolated node, no edges
        RoutePathResult result = dijkstra.findShortestPath(g, "A", "Z");
        assertFalse(result.isPathFound());
    }

    @Test
    void emptyGraphReturnsNoPath() {
        RoutePathResult result = dijkstra.findShortestPath(new Graph(), "A", "B");
        assertFalse(result.isPathFound());
    }

    @Test
    void invalidNodesReturnNoPath() {
        RoutePathResult result = dijkstra.findShortestPath(simpleGraph(), "X", "Y");
        assertFalse(result.isPathFound());
    }
}
