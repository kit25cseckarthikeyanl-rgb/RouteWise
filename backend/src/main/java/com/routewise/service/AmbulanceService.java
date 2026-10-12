package com.routewise.service;

import com.routewise.dto.AmbulanceDto;
import com.routewise.entity.Ambulance;
import com.routewise.entity.Enums;
import com.routewise.exception.ResourceNotFoundException;
import com.routewise.repository.AmbulanceRepository;
import com.routewise.websocket.TrackingBroadcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AmbulanceService {

    private final AmbulanceRepository ambulanceRepository;
    private final TrackingBroadcastService trackingBroadcastService;
    private final AuditService auditService;

    public List<AmbulanceDto> getAll() {
        return ambulanceRepository.findAll().stream().map(this::toDto).toList();
    }

    public List<AmbulanceDto> getByResponderType(Enums.ResponderType type) {
        return ambulanceRepository.findByResponderType(type).stream().map(this::toDto).toList();
    }

    public AmbulanceDto getById(Long id) {
        return toDto(getOrThrow(id));
    }

    public AmbulanceDto create(String vehicleNumber, double lat, double lon) {
        Ambulance ambulance = Ambulance.builder()
                .vehicleNumber(vehicleNumber)
                .responderType(Enums.ResponderType.AMBULANCE)
                .latitude(lat)
                .longitude(lon)
                .status(Enums.AmbulanceStatus.AVAILABLE)
                .build();
        return toDto(ambulanceRepository.save(ambulance));
    }

    public AmbulanceDto updateStatus(Long id, Enums.AmbulanceStatus status, Long actorUserId) {
        Ambulance ambulance = getOrThrow(id);
        ambulance.setStatus(status);
        ambulance = ambulanceRepository.save(ambulance);
        auditService.log(actorUserId, "STATUS_UPDATED", "Ambulance", ambulance.getId(), "Status -> " + status);
        return toDto(ambulance);
    }

    public AmbulanceDto updateLocation(Long id, double lat, double lon) {
        Ambulance ambulance = getOrThrow(id);
        ambulance.setLatitude(lat);
        ambulance.setLongitude(lon);
        ambulance = ambulanceRepository.save(ambulance);

        if (ambulance.getResponderType() == Enums.ResponderType.POLICE) {
            trackingBroadcastService.broadcastPoliceLocation(id, lat, lon, ambulance.getStatus().name(), null);
        } else if (ambulance.getResponderType() == Enums.ResponderType.FIRE_ENGINE) {
            trackingBroadcastService.broadcastFireLocation(id, lat, lon, ambulance.getStatus().name(), null);
        } else {
            trackingBroadcastService.broadcastAmbulanceLocation(id, lat, lon, ambulance.getStatus().name(), null);
        }

        if (ambulance.getCurrentEmergencyId() != null) {
            trackingBroadcastService.broadcastEmergencyLocation(
                    ambulance.getCurrentEmergencyId(), id, lat, lon, ambulance.getStatus().name(), null);
        }

        return toDto(ambulance);
    }

    private Ambulance getOrThrow(Long id) {
        return ambulanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Responder unit not found: " + id));
    }

    private AmbulanceDto toDto(Ambulance a) {
        return AmbulanceDto.builder()
                .id(a.getId())
                .vehicleNumber(a.getVehicleNumber())
                .responderType(a.getResponderType() != null ? a.getResponderType().name() : "AMBULANCE")
                .driverId(a.getDriverId())
                .latitude(a.getLatitude())
                .longitude(a.getLongitude())
                .status(a.getStatus().name())
                .currentEmergencyId(a.getCurrentEmergencyId())
                .lastUpdated(a.getLastUpdated())
                .build();
    }
}
