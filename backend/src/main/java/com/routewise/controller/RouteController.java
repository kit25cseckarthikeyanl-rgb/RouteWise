package com.routewise.controller;

import com.routewise.dto.ApiResponse;
import com.routewise.dto.RouteResultDto;
import com.routewise.service.RouteOptimizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final RouteOptimizationService routeOptimizationService;

    @GetMapping("/emergency/{emergencyId}")
    public ResponseEntity<ApiResponse<RouteResultDto>> getRouteForEmergency(@PathVariable Long emergencyId) {
        return ResponseEntity.ok(ApiResponse.success(
                routeOptimizationService.getRouteForEmergency(emergencyId)));
    }

    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<RouteResultDto>> calculate(@RequestBody Map<String, Object> body) {
        double[] coords = extractCoords(body);
        return ResponseEntity.ok(ApiResponse.success(
                routeOptimizationService.calculateShortestRoute(coords[0], coords[1], coords[2], coords[3])));
    }

    @PostMapping("/dijkstra")
    public ResponseEntity<ApiResponse<RouteResultDto>> dijkstra(@RequestBody Map<String, Object> body) {
        double[] coords = extractCoords(body);
        double traffic = body.get("trafficFactor") != null ? ((Number) body.get("trafficFactor")).doubleValue() : 1.2;
        return ResponseEntity.ok(ApiResponse.success(
                routeOptimizationService.calculateDijkstraRoute(coords[0], coords[1], coords[2], coords[3], traffic)));
    }

    @PostMapping("/astar")
    public ResponseEntity<ApiResponse<RouteResultDto>> astar(@RequestBody Map<String, Object> body) {
        double[] coords = extractCoords(body);
        double traffic = body.get("trafficFactor") != null ? ((Number) body.get("trafficFactor")).doubleValue() : 1.2;
        return ResponseEntity.ok(ApiResponse.success(
                routeOptimizationService.calculateAStarRoute(coords[0], coords[1], coords[2], coords[3], traffic)));
    }

    private double[] extractCoords(Map<String, Object> body) {
        double srcLat = ((Number) body.get("sourceLatitude")).doubleValue();
        double srcLon = ((Number) body.get("sourceLongitude")).doubleValue();
        double destLat = ((Number) body.get("destinationLatitude")).doubleValue();
        double destLon = ((Number) body.get("destinationLongitude")).doubleValue();
        return new double[]{srcLat, srcLon, destLat, destLon};
    }
}
