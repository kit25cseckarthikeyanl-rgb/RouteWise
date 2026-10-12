package com.routewise.service;

import com.routewise.algorithm.*;
import com.routewise.dto.RouteResultDto;
import com.routewise.entity.*;
import com.routewise.exception.ResourceNotFoundException;
import com.routewise.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Builds a synthetic road-network graph between two GPS points and runs
 * Dijkstra or A* over it to produce a route. This is an academic-prototype
 * simulation: it does not call any live routing/traffic provider.
 */
@Service
@RequiredArgsConstructor
public class RouteOptimizationService {

    private final SyntheticRoadNetworkProvider roadNetworkProvider;
    private final DijkstraAlgorithm dijkstraAlgorithm;
    private final AStarAlgorithm aStarAlgorithm;

    private final RouteRepository routeRepository;
    private final RoutePointRepository routePointRepository;
    private final EmergencyRequestRepository emergencyRepository;
    private final EmergencyAssignmentRepository assignmentRepository;
    private final EmergencyOfferRepository offerRepository;
    private final AmbulanceRepository ambulanceRepository;

    public RouteResultDto getRouteForEmergency(Long emergencyId) {
        List<com.routewise.entity.Route> routes = routeRepository.findByEmergencyId(emergencyId);
        if (!routes.isEmpty()) {
            com.routewise.entity.Route latest = routes.get(routes.size() - 1);
            List<RoutePoint> points = routePointRepository.findByRouteIdOrderBySequenceNumberAsc(latest.getId());
            List<double[]> coords = points.stream()
                    .map(p -> new double[]{p.getLatitude(), p.getLongitude()})
                    .toList();
            return RouteResultDto.builder()
                    .algorithm(latest.getAlgorithm() != null ? latest.getAlgorithm().name() : "DIJKSTRA")
                    .distanceKm(round2(latest.getDistance()))
                    .estimatedTimeMinutes(round2(latest.getEstimatedTime()))
                    .nodesExplored(points.size())
                    .routePoints(coords)
                    .build();
        }

        EmergencyRequest emergency = emergencyRepository.findById(emergencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency not found: " + emergencyId));

        Long responderUnitId = null;
        Optional<EmergencyAssignment> assignment = assignmentRepository.findTopByEmergencyIdOrderByAssignedAtDesc(emergencyId);
        if (assignment.isPresent()) {
            responderUnitId = assignment.get().getAmbulanceId();
        } else {
            Optional<EmergencyOffer> offer = offerRepository.findTopByEmergencyIdOrderByOfferedAtDesc(emergencyId);
            if (offer.isPresent()) {
                responderUnitId = offer.get().getResponderId();
            }
        }

        if (responderUnitId != null) {
            Ambulance unit = ambulanceRepository.findById(responderUnitId).orElse(null);
            if (unit != null) {
                return calculateShortestRoute(unit.getLatitude(), unit.getLongitude(), emergency.getLatitude(), emergency.getLongitude());
            }
        }

        return RouteResultDto.builder()
                .algorithm("NONE")
                .distanceKm(0.0)
                .estimatedTimeMinutes(0.0)
                .nodesExplored(0)
                .routePoints(List.of())
                .build();
    }

    public RouteResultDto calculateDijkstraRoute(double srcLat, double srcLon, double destLat, double destLon, double simulatedTrafficFactor) {
        Graph graph = roadNetworkProvider.buildGraphBetween(srcLat, srcLon, destLat, destLon, simulatedTrafficFactor);
        RoutePathResult result = dijkstraAlgorithm.findShortestPath(graph, roadNetworkProvider.getSourceNodeId(), roadNetworkProvider.getDestinationNodeId());
        return toDto(result, "DIJKSTRA");
    }

    public RouteResultDto calculateAStarRoute(double srcLat, double srcLon, double destLat, double destLon, double simulatedTrafficFactor) {
        Graph graph = roadNetworkProvider.buildGraphBetween(srcLat, srcLon, destLat, destLon, simulatedTrafficFactor);
        RoutePathResult result = aStarAlgorithm.findShortestPath(graph, roadNetworkProvider.getSourceNodeId(), roadNetworkProvider.getDestinationNodeId());
        return toDto(result, "ASTAR");
    }

    /** Default route calculation - uses A* (generally more efficient) unless a specific algorithm is requested. */
    public RouteResultDto calculateShortestRoute(double srcLat, double srcLon, double destLat, double destLon) {
        return calculateAStarRoute(srcLat, srcLon, destLat, destLon, 1.2);
    }

    public double estimateTravelTime(double distanceKm, double simulatedTrafficFactor) {
        double baseTimeMin = distanceKm / 0.7;
        return baseTimeMin * simulatedTrafficFactor;
    }

    private RouteResultDto toDto(RoutePathResult result, String algorithm) {
        List<double[]> points = result.getPath().stream()
                .map(n -> new double[]{n.getLatitude(), n.getLongitude()})
                .collect(Collectors.toList());

        return RouteResultDto.builder()
                .algorithm(algorithm)
                .distanceKm(round2(result.getTotalDistanceKm()))
                .estimatedTimeMinutes(round2(result.getEstimatedTimeMinutes()))
                .nodesExplored(result.getNodesExplored())
                .routePoints(points)
                .build();
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
