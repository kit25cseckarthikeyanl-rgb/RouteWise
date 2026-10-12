package com.routewise.service;

import com.routewise.dto.*;
import com.routewise.entity.*;
import com.routewise.exception.BusinessException;
import com.routewise.exception.ResourceNotFoundException;
import com.routewise.repository.*;
import com.routewise.websocket.TrackingBroadcastService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Optional;

/**
 * Orchestrates the full emergency-response workflow:
 * creation -> server-side priority validation -> eligible resource ranking ->
 * time-bounded offer creation -> driver accept/decline & automatic reassignment ->
 * route calculation -> hospital selection -> live status transitions -> completion -> audit trail.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmergencyService {

    private final EmergencyRequestRepository emergencyRepository;
    private final EmergencyAssignmentRepository assignmentRepository;
    private final EmergencyOfferRepository offerRepository;
    private final AmbulanceRepository ambulanceRepository;
    private final DriverRepository driverRepository;
    private final RouteRepository routeRepository;
    private final RoutePointRepository routePointRepository;
    private final HospitalRepository hospitalRepository;

    private final ResourceRankingService resourceRankingService;
    private final EmergencyOfferService emergencyOfferService;
    private final HospitalSelectionService hospitalSelectionService;
    private final RouteOptimizationService routeOptimizationService;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final TrackingBroadcastService trackingBroadcastService;

    @Transactional
    public EmergencyDto createEmergency(Long citizenId, CreateEmergencyRequest request) {
        // Server-side validation of priority against emergency category
        Enums.Priority validatedPriority = validatePriority(request.getEmergencyType(), request.getPriority());

        EmergencyRequest emergency = EmergencyRequest.builder()
                .requestNumber(generateRequestNumber())
                .requesterId(citizenId)
                .citizenName(request.getCitizenName())
                .contactNumber(request.getContactNumber())
                .emergencyType(request.getEmergencyType())
                .priority(validatedPriority)
                .description(request.getDescription())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .readableAddress(request.getReadableAddress())
                .landmark(request.getLandmark())
                .affectedPeopleCount(request.getAffectedPeopleCount() != null ? request.getAffectedPeopleCount() : 1)
                .status(Enums.EmergencyStatus.CREATED)
                .build();

        emergency = emergencyRepository.save(emergency);
        auditService.log(citizenId, "EMERGENCY_CREATED", "EmergencyRequest", emergency.getId(),
                "Emergency " + emergency.getRequestNumber() + " created (" + request.getEmergencyType() + ", priority: " + validatedPriority + ")");

        notificationService.notify(citizenId, Enums.NotificationType.EMERGENCY_CREATED,
                "Emergency Created", "Your emergency request " + emergency.getRequestNumber() + " has been registered.");

        trackingBroadcastService.broadcastAdminDashboard(toDto(emergency));

        // Immediately search + dispatch offer
        emergency.setStatus(Enums.EmergencyStatus.SEARCHING_RESOURCE);
        emergency = emergencyRepository.save(emergency);

        dispatch(emergency.getId());

        return toDto(emergencyRepository.findById(emergency.getId()).orElseThrow());
    }

    /**
     * Server-side priority validator ensuring critical life-threatening categories
     * cannot be under-triaged.
     */
    private Enums.Priority validatePriority(Enums.EmergencyType type, Enums.Priority requested) {
        if (type == Enums.EmergencyType.CARDIAC || type == Enums.EmergencyType.TRAUMA) {
            if (requested == Enums.Priority.LOW || requested == Enums.Priority.MEDIUM) {
                return Enums.Priority.CRITICAL;
            }
        }
        return requested != null ? requested : Enums.Priority.HIGH;
    }

    /**
     * Determines the appropriate responder type based on emergency category (Section 7).
     */
    public Enums.ResponderType resolveResponderType(Enums.EmergencyType emergencyType) {
        return switch (emergencyType) {
            case POLICE -> Enums.ResponderType.POLICE;
            case FIRE -> Enums.ResponderType.FIRE_ENGINE;
            case MEDICAL, AMBULANCE, CARDIAC, TRAUMA, ACCIDENT, OTHER -> Enums.ResponderType.AMBULANCE;
        };
    }

    @Transactional
    public List<RankedAmbulanceDto> rankForEmergency(Long emergencyId) {
        EmergencyRequest emergency = getEmergencyOrThrow(emergencyId);
        Enums.ResponderType responderType = resolveResponderType(emergency.getEmergencyType());
        List<Long> excluded = offerRepository.findExcludedResponderIdsForEmergency(emergency.getId(), responderType);
        return resourceRankingService.rankAvailableResponders(emergency, responderType, excluded);
    }

    /**
     * Dispatches the emergency to the best available eligible responder.
     * Uses sequential time-bounded offers with decline and timeout reassignment.
     */
    @Transactional
    public EmergencyDto dispatch(Long emergencyId) {
        EmergencyRequest emergency = getEmergencyOrThrow(emergencyId);

        // If already assigned or completed, do not dispatch new offers
        if (emergency.getStatus() == Enums.EmergencyStatus.ASSIGNED ||
            emergency.getStatus() == Enums.EmergencyStatus.ACCEPTED ||
            emergency.getStatus() == Enums.EmergencyStatus.EN_ROUTE_TO_PATIENT ||
            emergency.getStatus() == Enums.EmergencyStatus.COMPLETED ||
            emergency.getStatus() == Enums.EmergencyStatus.CANCELLED) {
            return toDto(emergency);
        }

        // Check if there is already an active pending offer
        LocalDateTime now = LocalDateTime.now();
        List<EmergencyOffer> existingActive = offerRepository.findByEmergencyId(emergencyId).stream()
                .filter(o -> o.getStatus() == Enums.OfferStatus.PENDING && o.getExpiresAt().isAfter(now))
                .toList();

        if (!existingActive.isEmpty()) {
            return toDto(emergency);
        }

        Enums.ResponderType responderType = resolveResponderType(emergency.getEmergencyType());
        List<Long> excludedResponderIds = offerRepository.findExcludedResponderIdsForEmergency(emergency.getId(), responderType);

        List<RankedAmbulanceDto> ranked = resourceRankingService.rankAvailableResponders(
                emergency, responderType, excludedResponderIds);

        if (ranked.isEmpty()) {
            if (emergency.getStatus() != Enums.EmergencyStatus.NO_RESOURCE_AVAILABLE) {
                emergency.setStatus(Enums.EmergencyStatus.NO_RESOURCE_AVAILABLE);
                emergency = emergencyRepository.save(emergency);

                auditService.log(null, "NO_RESOURCE_AVAILABLE", "EmergencyRequest", emergency.getId(),
                        "No available " + responderType + " units for emergency " + emergency.getRequestNumber());

                notificationService.notify(emergency.getRequesterId(), Enums.NotificationType.NO_RESOURCE,
                        "Searching for Responders",
                        "We are actively searching for an available " + responderType + " unit in your area.");

                EmergencyDto dto = toDto(emergency);
                trackingBroadcastService.broadcastEmergencyUpdate(emergency.getId(), dto);
                trackingBroadcastService.broadcastAdminDashboard(dto);
                return dto;
            }
            return toDto(emergency);
        }

        RankedAmbulanceDto best = ranked.get(0);
        Ambulance responder = ambulanceRepository.findById(best.getAmbulanceId())
                .orElseThrow(() -> new ResourceNotFoundException("Responder unit not found"));

        emergency.setStatus(Enums.EmergencyStatus.SEARCHING_RESOURCE);
        emergency = emergencyRepository.save(emergency);

        // Create time-bounded offer
        emergencyOfferService.createOffer(
                emergency,
                responder,
                best.getScore(),
                best.getDistanceKm(),
                best.getEstimatedResponseTimeMinutes());

        EmergencyDto dto = toDto(emergency);
        trackingBroadcastService.broadcastEmergencyUpdate(emergency.getId(), dto);
        trackingBroadcastService.broadcastAdminDashboard(dto);

        return dto;
    }

    /**
     * Background scheduler running every 4 seconds to inspect unassigned emergencies
     * and retry dispatching if no active offer is pending.
     */
    @Scheduled(fixedDelay = 4000)
    @Transactional
    public void retryPendingDispatches() {
        List<Enums.EmergencyStatus> unassignedStatuses = List.of(
                Enums.EmergencyStatus.SEARCHING_RESOURCE,
                Enums.EmergencyStatus.NO_RESOURCE_AVAILABLE
        );
        List<EmergencyRequest> unassigned = emergencyRepository.findByStatusIn(unassignedStatuses);

        for (EmergencyRequest e : unassigned) {
            try {
                dispatch(e.getId());
            } catch (Exception ex) {
                log.warn("Error during automatic reassignment for emergency #{}: {}", e.getId(), ex.getMessage());
            }
        }
    }

    @org.springframework.context.event.EventListener
    @Transactional
    public void onOfferReassigned(com.routewise.dto.OfferReassignedEvent event) {
        log.info("Immediate automatic reassignment triggered for emergency #{}", event.emergencyId());
        try {
            dispatch(event.emergencyId());
        } catch (Exception e) {
            log.warn("Immediate automatic reassignment failed for emergency {}: {}", event.emergencyId(), e.getMessage());
        }
    }

    @Transactional
    public EmergencyDto driverAccept(Long emergencyId, Long driverUserId) {
        EmergencyRequest emergency = getEmergencyOrThrow(emergencyId);
        EmergencyAssignment assignment = assignmentRepository.findTopByEmergencyIdOrderByAssignedAtDesc(emergencyId)
                .orElseThrow(() -> new BusinessException("No assignment exists for this emergency", "NO_ASSIGNMENT"));

        assignment.setAcceptedAt(LocalDateTime.now());
        assignment.setStatus(Enums.AssignmentStatus.ACCEPTED);
        assignmentRepository.save(assignment);

        emergency.setStatus(Enums.EmergencyStatus.ACCEPTED);
        emergency = emergencyRepository.save(emergency);

        auditService.log(driverUserId, "STATUS_UPDATED", "EmergencyRequest", emergency.getId(), "Driver accepted assignment");

        // Calculate route (Dijkstra)
        Ambulance ambulance = ambulanceRepository.findById(assignment.getAmbulanceId()).orElseThrow();
        RouteResultDto routeResult = routeOptimizationService.calculateDijkstraRoute(
                ambulance.getLatitude(), ambulance.getLongitude(),
                emergency.getLatitude(), emergency.getLongitude(), 1.2);
        persistRoute(emergency.getId(), ambulance.getId(),
                ambulance.getLatitude(), ambulance.getLongitude(),
                emergency.getLatitude(), emergency.getLongitude(), routeResult);

        auditService.log(driverUserId, "ROUTE_CALCULATED", "EmergencyRequest", emergency.getId(),
                "Dijkstra route: " + routeResult.getDistanceKm() + " km, ETA " + routeResult.getEstimatedTimeMinutes() + " min");

        // Rank + select hospital for medical emergencies
        if (emergency.getEmergencyType() != Enums.EmergencyType.POLICE && emergency.getEmergencyType() != Enums.EmergencyType.FIRE) {
            List<RankedHospitalDto> hospitals = hospitalSelectionService.rankHospitals(emergency.getLatitude(), emergency.getLongitude());
            if (!hospitals.isEmpty()) {
                RankedHospitalDto topHospital = hospitals.get(0);
                emergency.setSelectedHospitalId(topHospital.getHospitalId());
                emergency = emergencyRepository.save(emergency);

                auditService.log(driverUserId, "HOSPITAL_SELECTED", "EmergencyRequest", emergency.getId(),
                        "Hospital " + topHospital.getName() + " selected. Reason: " + topHospital.getSelectionReason());
                notificationService.notify(emergency.getRequesterId(), Enums.NotificationType.HOSPITAL_SELECTED,
                        "Hospital Selected", topHospital.getName() + " will receive the patient. " + topHospital.getSelectionReason());
            }
        }

        notificationService.notify(emergency.getRequesterId(), Enums.NotificationType.DRIVER_ACCEPTED,
                "Driver Accepted", "The assigned responder has accepted your emergency request.");

        trackingBroadcastService.broadcastEmergencyUpdate(emergency.getId(), toDto(emergency));
        return toDto(emergency);
    }

    @Transactional
    public EmergencyDto updateStatus(Long emergencyId, Enums.EmergencyStatus newStatus, Long actorUserId) {
        EmergencyRequest emergency = getEmergencyOrThrow(emergencyId);
        Enums.EmergencyStatus old = emergency.getStatus();
        emergency.setStatus(newStatus);
        emergency = emergencyRepository.save(emergency);

        auditService.log(actorUserId, "STATUS_UPDATED", "EmergencyRequest", emergency.getId(),
                old + " -> " + newStatus);

        if (newStatus == Enums.EmergencyStatus.COMPLETED) {
            completeEmergency(emergency);
        }

        trackingBroadcastService.broadcastEmergencyUpdate(emergency.getId(), toDto(emergency));
        trackingBroadcastService.broadcastAdminDashboard(toDto(emergency));
        return toDto(emergency);
    }

    private void completeEmergency(EmergencyRequest emergency) {
        assignmentRepository.findTopByEmergencyIdOrderByAssignedAtDesc(emergency.getId()).ifPresent(assignment -> {
            assignment.setStatus(Enums.AssignmentStatus.COMPLETED);
            assignmentRepository.save(assignment);

            ambulanceRepository.findById(assignment.getAmbulanceId()).ifPresent(ambulance -> {
                ambulance.setStatus(Enums.AmbulanceStatus.AVAILABLE);
                ambulance.setCurrentEmergencyId(null);
                ambulanceRepository.save(ambulance);
            });
        });

        notificationService.notify(emergency.getRequesterId(), Enums.NotificationType.EMERGENCY_COMPLETED,
                "Emergency Completed", "Emergency " + emergency.getRequestNumber() + " has been marked as completed.");

        auditService.log(null, "EMERGENCY_COMPLETED", "EmergencyRequest", emergency.getId(), "Responder released and made AVAILABLE");
    }

    @Transactional
    public EmergencyDto cancelEmergency(Long emergencyId, Long actorUserId) {
        EmergencyRequest emergency = getEmergencyOrThrow(emergencyId);
        emergency.setStatus(Enums.EmergencyStatus.CANCELLED);
        emergency = emergencyRepository.save(emergency);

        // Cancel any active offers
        List<EmergencyOffer> offers = offerRepository.findByEmergencyId(emergencyId);
        for (EmergencyOffer o : offers) {
            if (o.getStatus() == Enums.OfferStatus.PENDING) {
                o.setStatus(Enums.OfferStatus.CANCELLED);
                offerRepository.save(o);
                ambulanceRepository.findById(o.getResponderId()).ifPresent(unit -> {
                    if (unit.getStatus() == Enums.AmbulanceStatus.REQUEST_PENDING) {
                        unit.setStatus(Enums.AmbulanceStatus.AVAILABLE);
                        ambulanceRepository.save(unit);
                    }
                });
            }
        }

        assignmentRepository.findTopByEmergencyIdOrderByAssignedAtDesc(emergency.getId()).ifPresent(assignment -> {
            assignment.setStatus(Enums.AssignmentStatus.CANCELLED);
            assignmentRepository.save(assignment);
            ambulanceRepository.findById(assignment.getAmbulanceId()).ifPresent(ambulance -> {
                ambulance.setStatus(Enums.AmbulanceStatus.AVAILABLE);
                ambulance.setCurrentEmergencyId(null);
                ambulanceRepository.save(ambulance);
            });
        });

        auditService.log(actorUserId, "STATUS_UPDATED", "EmergencyRequest", emergency.getId(), "Emergency cancelled");
        trackingBroadcastService.broadcastEmergencyUpdate(emergency.getId(), toDto(emergency));
        return toDto(emergency);
    }

    public EmergencyDto getById(Long id) {
        return toDto(getEmergencyOrThrow(id));
    }

    public List<EmergencyDto> getForRequester(Long requesterId) {
        return emergencyRepository.findByRequesterId(requesterId).stream().map(this::toDto).toList();
    }

    public List<EmergencyDto> getAll() {
        return emergencyRepository.findAll().stream().map(this::toDto).toList();
    }

    public List<EmergencyDto> getActive() {
        List<Enums.EmergencyStatus> activeStatuses = List.of(
                Enums.EmergencyStatus.CREATED,
                Enums.EmergencyStatus.SEARCHING_RESOURCE,
                Enums.EmergencyStatus.NO_RESOURCE_AVAILABLE,
                Enums.EmergencyStatus.ASSIGNED,
                Enums.EmergencyStatus.ACCEPTED,
                Enums.EmergencyStatus.EN_ROUTE_TO_PATIENT,
                Enums.EmergencyStatus.PATIENT_PICKED_UP,
                Enums.EmergencyStatus.EN_ROUTE_TO_HOSPITAL,
                Enums.EmergencyStatus.ARRIVED_AT_HOSPITAL
        );
        return emergencyRepository.findByStatusIn(activeStatuses).stream().map(this::toDto).toList();
    }

    private void persistRoute(Long emergencyId, Long ambulanceId, double srcLat, double srcLon,
                               double destLat, double destLon, RouteResultDto result) {
        com.routewise.entity.Route route = com.routewise.entity.Route.builder()
                .emergencyId(emergencyId)
                .ambulanceId(ambulanceId)
                .sourceLatitude(srcLat)
                .sourceLongitude(srcLon)
                .destinationLatitude(destLat)
                .destinationLongitude(destLon)
                .distance(result.getDistanceKm())
                .estimatedTime(result.getEstimatedTimeMinutes())
                .algorithm(Enums.RouteAlgorithm.valueOf(result.getAlgorithm()))
                .build();
        route = routeRepository.save(route);

        int seq = 0;
        for (double[] point : result.getRoutePoints()) {
            RoutePoint rp = RoutePoint.builder()
                    .routeId(route.getId())
                    .sequenceNumber(seq++)
                    .latitude(point[0])
                    .longitude(point[1])
                    .build();
            routePointRepository.save(rp);
        }
    }

    private String generateRequestNumber() {
        int year = Year.now().getValue();
        long countThisYear = emergencyRepository.count() + 1;
        return String.format("RW-%d-%06d", year, countThisYear);
    }

    private EmergencyRequest getEmergencyOrThrow(Long id) {
        return emergencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency not found: " + id));
    }

    public EmergencyDto toDto(EmergencyRequest e) {
        EmergencyDto.EmergencyDtoBuilder builder = EmergencyDto.builder()
                .id(e.getId())
                .requestNumber(e.getRequestNumber())
                .requesterId(e.getRequesterId())
                .citizenName(e.getCitizenName())
                .contactNumber(e.getContactNumber())
                .emergencyType(e.getEmergencyType().name())
                .priority(e.getPriority().name())
                .description(e.getDescription())
                .latitude(e.getLatitude())
                .longitude(e.getLongitude())
                .readableAddress(e.getReadableAddress())
                .landmark(e.getLandmark())
                .affectedPeopleCount(e.getAffectedPeopleCount())
                .status(e.getStatus().name())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt());

        Optional<EmergencyAssignment> assignmentOpt = assignmentRepository.findTopByEmergencyIdOrderByAssignedAtDesc(e.getId());
        assignmentOpt.ifPresent(assignment -> {
            builder.assignedAmbulanceId(assignment.getAmbulanceId());
            builder.etaMinutes(assignment.getEstimatedResponseTime());
            ambulanceRepository.findById(assignment.getAmbulanceId()).ifPresent(amb -> {
                builder.assignedVehicleNumber(amb.getVehicleNumber());
                builder.assignedDriverId(amb.getDriverId());
            });
        });

        // Check active pending offer if not yet assigned
        if (e.getStatus() == Enums.EmergencyStatus.SEARCHING_RESOURCE || e.getStatus() == Enums.EmergencyStatus.CREATED) {
            LocalDateTime now = LocalDateTime.now();
            offerRepository.findByEmergencyId(e.getId()).stream()
                    .filter(o -> o.getStatus() == Enums.OfferStatus.PENDING && o.getExpiresAt().isAfter(now))
                    .findFirst()
                    .ifPresent(activeOffer -> {
                        builder.activeOfferId(activeOffer.getId());
                        builder.offerExpiresAt(activeOffer.getExpiresAt());
                        builder.remainingOfferSeconds(Duration.between(now, activeOffer.getExpiresAt()).getSeconds());
                    });
        }

        if (e.getSelectedHospitalId() != null) {
            builder.selectedHospitalId(e.getSelectedHospitalId());
            hospitalRepository.findById(e.getSelectedHospitalId())
                    .ifPresent(h -> builder.selectedHospitalName(h.getName()));
        }

        return builder.build();
    }
}
