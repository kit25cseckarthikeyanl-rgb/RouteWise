package com.routewise.service;

import com.routewise.algorithm.AStarAlgorithm;
import com.routewise.dto.RankedAmbulanceDto;
import com.routewise.entity.Ambulance;
import com.routewise.entity.EmergencyRequest;
import com.routewise.entity.Enums;
import com.routewise.repository.AmbulanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

/**
 * Computes a transparent, explainable score for each AVAILABLE responder unit
 * relative to a given emergency, instead of simply picking the nearest one.
 *
 * Score is a weighted combination of:
 *  - normalized distance          (closer is better)
 *  - normalized estimated travel time (accounts for simulated traffic)
 *  - traffic penalty               (heavier simulated congestion is worse)
 *  - priority adjustment           (CRITICAL/HIGH emergencies weight travel time more heavily)
 *
 * Lower score = better candidate. Weights are configurable constants below.
 */
@Service
@RequiredArgsConstructor
public class ResourceRankingService {

    private final AmbulanceRepository ambulanceRepository;

    // Configurable weights - tuned for demo purposes, sum need not equal 1.
    private static final double WEIGHT_DISTANCE = 0.35;
    private static final double WEIGHT_TRAVEL_TIME = 0.45;
    private static final double WEIGHT_TRAFFIC = 0.20;

    private static final double AVERAGE_CITY_SPEED_KM_PER_MIN = 0.5; // ~30 km/h baseline

    private final Random simulatedTrafficRandom = new Random(); // demo-only simulated traffic

    public List<RankedAmbulanceDto> rankAvailableAmbulances(EmergencyRequest emergency) {
        return rankAvailableResponders(emergency, Enums.ResponderType.AMBULANCE, List.of());
    }

    public List<RankedAmbulanceDto> rankAvailableResponders(
            EmergencyRequest emergency,
            Enums.ResponderType responderType,
            List<Long> excludedResponderIds) {

        List<Ambulance> available = ambulanceRepository.findByStatus(Enums.AmbulanceStatus.AVAILABLE);

        List<Ambulance> filtered = available.stream()
                .filter(a -> a.getResponderType() == responderType || (responderType == Enums.ResponderType.AMBULANCE && a.getResponderType() == null))
                .filter(a -> excludedResponderIds == null || !excludedResponderIds.contains(a.getId()))
                .toList();

        if (filtered.isEmpty()) {
            return List.of();
        }

        double priorityMultiplier = priorityTravelTimeMultiplier(emergency.getPriority());

        return filtered.stream().map(amb -> {
            double distanceKm = AStarAlgorithm.haversineKm(
                    amb.getLatitude(), amb.getLongitude(),
                    emergency.getLatitude(), emergency.getLongitude());

            // Simulated traffic condition per-ambulance (demo only - not a live traffic feed)
            double trafficFactor = 1.0 + simulatedTrafficRandom.nextDouble() * 0.8; // 1.0 - 1.8x
            String trafficLabel = trafficLabel(trafficFactor);

            double baseTravelTimeMin = distanceKm / AVERAGE_CITY_SPEED_KM_PER_MIN;
            double estimatedResponseTime = baseTravelTimeMin * trafficFactor;

            double normalizedDistance = distanceKm; // raw km, weighted below
            double normalizedTravelTime = estimatedResponseTime * priorityMultiplier;
            double trafficPenalty = (trafficFactor - 1.0) * 10.0;

            double score = (normalizedDistance * WEIGHT_DISTANCE)
                    + (normalizedTravelTime * WEIGHT_TRAVEL_TIME)
                    + (trafficPenalty * WEIGHT_TRAFFIC);

            String reason = buildReason(distanceKm, estimatedResponseTime, trafficLabel, emergency.getPriority());

            return RankedAmbulanceDto.builder()
                    .ambulanceId(amb.getId())
                    .vehicleNumber(amb.getVehicleNumber())
                    .score(round2(score))
                    .distanceKm(round2(distanceKm))
                    .estimatedResponseTimeMinutes(round2(estimatedResponseTime))
                    .trafficCondition(trafficLabel)
                    .availability(amb.getStatus().name())
                    .selectionReason(reason)
                    .build();
        }).sorted(Comparator.comparingDouble(RankedAmbulanceDto::getScore))
          .collect(Collectors.toList());
    }

    private double priorityTravelTimeMultiplier(Enums.Priority priority) {
        return switch (priority) {
            case CRITICAL -> 1.5;
            case HIGH -> 1.25;
            case MEDIUM -> 1.0;
            case LOW -> 0.85;
        };
    }

    private String trafficLabel(double factor) {
        if (factor < 1.2) return "Light";
        if (factor < 1.5) return "Moderate";
        return "Heavy";
    }

    private String buildReason(double distKm, double etaMin, String traffic, Enums.Priority priority) {
        return String.format(
                "%.1f km away, ETA ~%.0f min in %s traffic (priority adjustment %s applied)",
                distKm, etaMin, traffic, priority);
    }

    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}
