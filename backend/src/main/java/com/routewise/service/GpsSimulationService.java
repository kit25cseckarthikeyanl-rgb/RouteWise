package com.routewise.service;

import com.routewise.entity.Ambulance;
import com.routewise.entity.RoutePoint;
import com.routewise.repository.AmbulanceRepository;
import com.routewise.repository.RoutePointRepository;
import com.routewise.repository.RouteRepository;
import com.routewise.websocket.TrackingBroadcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * DEMO SIMULATION MODE.
 *
 * Moves an ambulance's marker step-by-step through the stored route points
 * of its most recent Route, broadcasting each position over WebSocket. This
 * is a clearly-labelled simulation used for academic demonstration - it is
 * NOT real GPS.
 */
@Service
@RequiredArgsConstructor
public class GpsSimulationService {

    private final AmbulanceRepository ambulanceRepository;
    private final RouteRepository routeRepository;
    private final RoutePointRepository routePointRepository;
    private final TrackingBroadcastService trackingBroadcastService;

    private static final long STEP_DELAY_MS = 2500;

    private final ConcurrentHashMap<Long, AtomicBoolean> activeSimulations = new ConcurrentHashMap<>();

    @Async
    public void startSimulation(Long emergencyId, Long ambulanceId) {
        AtomicBoolean flag = new AtomicBoolean(true);
        activeSimulations.put(ambulanceId, flag);

        List<com.routewise.entity.Route> routes = routeRepository.findByEmergencyId(emergencyId);
        if (routes.isEmpty()) return;

        com.routewise.entity.Route latestRoute = routes.get(routes.size() - 1);
        List<RoutePoint> points = routePointRepository.findByRouteIdOrderBySequenceNumberAsc(latestRoute.getId());

        Ambulance ambulance = ambulanceRepository.findById(ambulanceId).orElse(null);
        if (ambulance == null) return;

        int totalSteps = points.size();
        for (int i = 0; i < totalSteps && flag.get(); i++) {
            RoutePoint point = points.get(i);
            ambulance.setLatitude(point.getLatitude());
            ambulance.setLongitude(point.getLongitude());
            ambulanceRepository.save(ambulance);

            double remainingFraction = 1.0 - ((double) i / totalSteps);
            double etaMinutes = latestRoute.getEstimatedTime() * remainingFraction;

            trackingBroadcastService.broadcastAmbulanceLocation(
                    ambulanceId, point.getLatitude(), point.getLongitude(),
                    "DEMO_SIMULATION_" + ambulance.getStatus().name(), etaMinutes);

            if (ambulance.getResponderType() == com.routewise.entity.Enums.ResponderType.POLICE) {
                trackingBroadcastService.broadcastPoliceLocation(
                        ambulanceId, point.getLatitude(), point.getLongitude(),
                        "DEMO_SIMULATION_" + ambulance.getStatus().name(), etaMinutes);
            } else if (ambulance.getResponderType() == com.routewise.entity.Enums.ResponderType.FIRE_ENGINE) {
                trackingBroadcastService.broadcastFireLocation(
                        ambulanceId, point.getLatitude(), point.getLongitude(),
                        "DEMO_SIMULATION_" + ambulance.getStatus().name(), etaMinutes);
            }

            trackingBroadcastService.broadcastEmergencyLocation(
                    emergencyId, ambulanceId, point.getLatitude(), point.getLongitude(),
                    "DEMO_SIMULATION_" + ambulance.getStatus().name(), etaMinutes);

            try {
                Thread.sleep(STEP_DELAY_MS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        activeSimulations.remove(ambulanceId);
    }

    public void stopSimulation(Long ambulanceId) {
        AtomicBoolean flag = activeSimulations.get(ambulanceId);
        if (flag != null) flag.set(false);
    }

    public boolean isSimulating(Long ambulanceId) {
        return activeSimulations.containsKey(ambulanceId);
    }
}
