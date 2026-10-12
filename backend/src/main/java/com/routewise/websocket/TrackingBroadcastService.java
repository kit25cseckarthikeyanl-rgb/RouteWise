package com.routewise.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Broadcasts live tracking events over STOMP topics.
 * Topics:
 *   /topic/ambulance/{ambulanceId}
 *   /topic/police/{unitId}
 *   /topic/fire/{unitId}
 *   /topic/emergency/{emergencyId}
 *   /topic/responder/{responderId}/offers
 *   /topic/admin/dashboard
 */
@Service
@RequiredArgsConstructor
public class TrackingBroadcastService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastAmbulanceLocation(Long ambulanceId, double lat, double lon, String status, Double etaMinutes) {
        LocationUpdateMessage message = LocationUpdateMessage.builder()
                .ambulanceId(ambulanceId)
                .latitude(lat)
                .longitude(lon)
                .status(status)
                .etaMinutes(etaMinutes)
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend("/topic/ambulance/" + ambulanceId, message);
    }

    public void broadcastPoliceLocation(Long unitId, double lat, double lon, String status, Double etaMinutes) {
        LocationUpdateMessage message = LocationUpdateMessage.builder()
                .ambulanceId(unitId)
                .latitude(lat)
                .longitude(lon)
                .status(status)
                .etaMinutes(etaMinutes)
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend("/topic/police/" + unitId, message);
    }

    public void broadcastFireLocation(Long unitId, double lat, double lon, String status, Double etaMinutes) {
        LocationUpdateMessage message = LocationUpdateMessage.builder()
                .ambulanceId(unitId)
                .latitude(lat)
                .longitude(lon)
                .status(status)
                .etaMinutes(etaMinutes)
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend("/topic/fire/" + unitId, message);
    }

    public void broadcastResponderOffer(Long responderId, Object offerPayload) {
        messagingTemplate.convertAndSend("/topic/responder/" + responderId + "/offers", offerPayload);
    }

    public void broadcastEmergencyUpdate(Long emergencyId, Object payload) {
        messagingTemplate.convertAndSend("/topic/emergency/" + emergencyId, payload);
    }

    public void broadcastEmergencyLocation(Long emergencyId, Long responderId, double lat, double lon, String status, Double etaMinutes) {
        LocationUpdateMessage message = LocationUpdateMessage.builder()
                .ambulanceId(responderId)
                .latitude(lat)
                .longitude(lon)
                .status(status)
                .etaMinutes(etaMinutes)
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend("/topic/emergency/" + emergencyId, message);
    }

    public void broadcastAdminDashboard(Object payload) {
        messagingTemplate.convertAndSend("/topic/admin/dashboard", payload);
    }
}
