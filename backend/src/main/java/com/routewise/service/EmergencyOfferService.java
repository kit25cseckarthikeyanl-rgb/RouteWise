package com.routewise.service;

import com.routewise.dto.EmergencyOfferDto;
import com.routewise.entity.*;
import com.routewise.exception.BusinessException;
import com.routewise.exception.ResourceNotFoundException;
import com.routewise.repository.*;
import com.routewise.websocket.TrackingBroadcastService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmergencyOfferService {

    private final EmergencyOfferRepository offerRepository;
    private final EmergencyRequestRepository emergencyRepository;
    private final AmbulanceRepository ambulanceRepository;
    private final DriverRepository driverRepository;
    private final EmergencyAssignmentRepository assignmentRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final TrackingBroadcastService trackingBroadcastService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Value("${routewise.dispatch.offer-timeout-seconds:30}")
    private int offerTimeoutSeconds = 30;

    /**
     * Creates and dispatches a time-bounded offer to an eligible responder.
     */
    @Transactional
    public EmergencyOffer createOffer(EmergencyRequest emergency, Ambulance responder, double score, double distance, double eta) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(offerTimeoutSeconds);

        EmergencyOffer offer = EmergencyOffer.builder()
                .emergencyId(emergency.getId())
                .responderType(responder.getResponderType())
                .responderId(responder.getId())
                .driverUserId(getDriverUserIdForResponder(responder))
                .status(Enums.OfferStatus.PENDING)
                .offeredAt(now)
                .expiresAt(expiresAt)
                .score(score)
                .distance(distance)
                .estimatedResponseTime(eta)
                .build();

        offer = offerRepository.save(offer);

        responder.setStatus(Enums.AmbulanceStatus.REQUEST_PENDING);
        ambulanceRepository.save(responder);

        auditService.log(null, "OFFER_CREATED", "EmergencyOffer", offer.getId(),
                "Offer " + offer.getId() + " sent to " + responder.getResponderType() + " " + responder.getVehicleNumber() +
                " for emergency " + emergency.getRequestNumber() + " (timeout: " + offerTimeoutSeconds + "s)");

        EmergencyOfferDto offerDto = toDto(offer, emergency, responder);

        // Notify over STOMP and persistent notifications
        trackingBroadcastService.broadcastResponderOffer(responder.getId(), offerDto);

        if (offer.getDriverUserId() != null) {
            notificationService.notify(offer.getDriverUserId(), Enums.NotificationType.OFFER_CREATED,
                    "Incoming Emergency Offer",
                    "Offer #" + offer.getId() + " for " + emergency.getEmergencyType() + " at " +
                    (emergency.getReadableAddress() != null ? emergency.getReadableAddress() : "coordinates") +
                    ". Respond within " + offerTimeoutSeconds + "s.");
        }

        return offer;
    }

    /**
     * Responder accepts an active offer.
     * Enforces atomic transaction so two concurrent accept requests cannot both succeed.
     */
    @Transactional
    public EmergencyOfferDto acceptOffer(Long offerId, Long driverUserId) {
        EmergencyOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found: " + offerId));

        validateResponderAuthorization(offer, driverUserId);

        LocalDateTime now = LocalDateTime.now();

        if (offer.getStatus() != Enums.OfferStatus.PENDING) {
            throw new BusinessException("Offer is no longer active (status: " + offer.getStatus() + ")", "OFFER_INACTIVE");
        }

        if (offer.getExpiresAt().isBefore(now)) {
            offer.setStatus(Enums.OfferStatus.EXPIRED);
            offerRepository.save(offer);
            throw new BusinessException("Offer has expired.", "OFFER_EXPIRED");
        }

        final Long emergencyId = offer.getEmergencyId();
        final Long responderId = offer.getResponderId();

        EmergencyRequest emergency = emergencyRepository.findById(emergencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency not found: " + emergencyId));

        // Conflict check: emergency already accepted or assigned to another unit
        if (emergency.getStatus() == Enums.EmergencyStatus.ASSIGNED ||
            emergency.getStatus() == Enums.EmergencyStatus.ACCEPTED ||
            emergency.getStatus() == Enums.EmergencyStatus.EN_ROUTE_TO_PATIENT) {
            offer.setStatus(Enums.OfferStatus.CANCELLED);
            offerRepository.save(offer);
            throw new BusinessException("This emergency has already been accepted by another responder unit.", "CONFLICT_ALREADY_ASSIGNED");
        }

        Ambulance responder = ambulanceRepository.findById(responderId)
                .orElseThrow(() -> new ResourceNotFoundException("Responder unit not found: " + responderId));

        // Transition offer to ACCEPTED
        offer.setStatus(Enums.OfferStatus.ACCEPTED);
        offer.setRespondedAt(now);
        offer = offerRepository.save(offer);

        // Cancel any other pending offers for this emergency
        List<EmergencyOffer> pendingOffers = offerRepository.findByEmergencyId(emergency.getId());
        for (EmergencyOffer other : pendingOffers) {
            if (!other.getId().equals(offer.getId()) && other.getStatus() == Enums.OfferStatus.PENDING) {
                other.setStatus(Enums.OfferStatus.CANCELLED);
                other.setRespondedAt(now);
                offerRepository.save(other);

                ambulanceRepository.findById(other.getResponderId()).ifPresent(otherUnit -> {
                    if (otherUnit.getStatus() == Enums.AmbulanceStatus.REQUEST_PENDING) {
                        otherUnit.setStatus(Enums.AmbulanceStatus.AVAILABLE);
                        ambulanceRepository.save(otherUnit);
                    }
                });
            }
        }

        // Create official EmergencyAssignment record
        EmergencyAssignment assignment = EmergencyAssignment.builder()
                .emergencyId(emergency.getId())
                .ambulanceId(responder.getId())
                .assignmentScore(offer.getScore() != null ? offer.getScore() : 1.0)
                .estimatedResponseTime(offer.getEstimatedResponseTime() != null ? offer.getEstimatedResponseTime() : 5.0)
                .distance(offer.getDistance() != null ? offer.getDistance() : 2.0)
                .reason("Accepted by responder unit " + responder.getVehicleNumber())
                .status(Enums.AssignmentStatus.ACCEPTED)
                .acceptedAt(now)
                .build();
        assignmentRepository.save(assignment);

        // Update responder unit status
        responder.setStatus(Enums.AmbulanceStatus.ASSIGNED);
        responder.setCurrentEmergencyId(emergency.getId());
        ambulanceRepository.save(responder);

        // Update emergency status
        emergency.setStatus(Enums.EmergencyStatus.ASSIGNED);
        emergencyRepository.save(emergency);

        auditService.log(driverUserId, "OFFER_ACCEPTED", "EmergencyOffer", offer.getId(),
                "Offer " + offer.getId() + " accepted by responder " + responder.getVehicleNumber());

        notificationService.notify(emergency.getRequesterId(), Enums.NotificationType.AMBULANCE_ASSIGNED,
                "Responder Assigned",
                responder.getResponderType() + " unit (" + responder.getVehicleNumber() +
                ") has accepted your emergency request and is assigned.");

        EmergencyOfferDto resultDto = toDto(offer, emergency, responder);

        // Broadcast to relevant topics
        trackingBroadcastService.broadcastEmergencyUpdate(emergency.getId(), resultDto);
        trackingBroadcastService.broadcastAdminDashboard(resultDto);
        trackingBroadcastService.broadcastResponderOffer(responder.getId(), resultDto);

        return resultDto;
    }

    /**
     * Responder explicitly declines an offer.
     */
    @Transactional
    public EmergencyOfferDto declineOffer(Long offerId, Long driverUserId, String reason) {
        EmergencyOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found: " + offerId));

        validateResponderAuthorization(offer, driverUserId);

        if (offer.getStatus() != Enums.OfferStatus.PENDING) {
            throw new BusinessException("Offer is no longer active (status: " + offer.getStatus() + ")", "OFFER_INACTIVE");
        }

        LocalDateTime now = LocalDateTime.now();
        offer.setStatus(Enums.OfferStatus.DECLINED);
        offer.setRespondedAt(now);
        offer.setDeclineReason(reason != null ? reason : "Declined by responder");
        offer = offerRepository.save(offer);

        Ambulance responder = ambulanceRepository.findById(offer.getResponderId()).orElse(null);
        if (responder != null && responder.getStatus() == Enums.AmbulanceStatus.REQUEST_PENDING) {
            responder.setStatus(Enums.AmbulanceStatus.AVAILABLE);
            ambulanceRepository.save(responder);
        }

        auditService.log(driverUserId, "OFFER_DECLINED", "EmergencyOffer", offer.getId(),
                "Offer " + offer.getId() + " declined by responder " +
                (responder != null ? responder.getVehicleNumber() : offer.getResponderId()) +
                ". Reason: " + offer.getDeclineReason());

        EmergencyRequest emergency = emergencyRepository.findById(offer.getEmergencyId()).orElse(null);
        EmergencyOfferDto resultDto = toDto(offer, emergency, responder);

        if (responder != null) {
            trackingBroadcastService.broadcastResponderOffer(responder.getId(), resultDto);
        }

        // Trigger immediate automatic reassignment to the next eligible responder
        eventPublisher.publishEvent(new com.routewise.dto.OfferReassignedEvent(offer.getEmergencyId()));

        return resultDto;
    }

    /**
     * Responder goes offline while offer is pending.
     */
    @Transactional
    public void handleResponderOffline(Long responderId) {
        LocalDateTime now = LocalDateTime.now();
        List<EmergencyOffer> pendingOffers = offerRepository.findActivePendingOffersForResponder(
                Enums.ResponderType.AMBULANCE, responderId, now);

        for (EmergencyOffer offer : pendingOffers) {
            offer.setStatus(Enums.OfferStatus.CANCELLED);
            offer.setRespondedAt(now);
            offer.setDeclineReason("Responder went offline");
            offerRepository.save(offer);

            auditService.log(null, "OFFER_CANCELLED", "EmergencyOffer", offer.getId(),
                    "Offer cancelled because responder " + responderId + " went offline");
        }
    }

    /**
     * Background scheduled task running every 3 seconds to expire timed-out offers
     * and trigger automatic reassignment.
     */
    @Scheduled(fixedDelay = 3000)
    @Transactional
    public void checkAndExpireOffers() {
        LocalDateTime now = LocalDateTime.now();
        List<EmergencyOffer> expiredOffers = offerRepository.findByStatusAndExpiresAtBefore(Enums.OfferStatus.PENDING, now);

        for (EmergencyOffer offer : expiredOffers) {
            offer.setStatus(Enums.OfferStatus.EXPIRED);
            offer.setRespondedAt(now);
            offerRepository.save(offer);

            ambulanceRepository.findById(offer.getResponderId()).ifPresent(unit -> {
                if (unit.getStatus() == Enums.AmbulanceStatus.REQUEST_PENDING) {
                    unit.setStatus(Enums.AmbulanceStatus.AVAILABLE);
                    ambulanceRepository.save(unit);
                }
            });

            auditService.log(null, "OFFER_EXPIRED", "EmergencyOffer", offer.getId(),
                    "Offer " + offer.getId() + " expired without response from responder " + offer.getResponderId());

            trackingBroadcastService.broadcastResponderOffer(offer.getResponderId(),
                    EmergencyOfferDto.builder()
                            .id(offer.getId())
                            .emergencyId(offer.getEmergencyId())
                            .status("EXPIRED")
                            .build());

            log.info("Expired offer #{} for emergency #{}. Reassignment will be evaluated.", offer.getId(), offer.getEmergencyId());

            // Trigger immediate automatic reassignment to the next eligible responder
            eventPublisher.publishEvent(new com.routewise.dto.OfferReassignedEvent(offer.getEmergencyId()));
        }
    }

    public List<EmergencyOfferDto> getActiveOffersForResponder(Enums.ResponderType responderType, Long responderId, Long driverUserId) {
        LocalDateTime now = LocalDateTime.now();
        List<EmergencyOffer> activeOffers = offerRepository.findActivePendingOffersForDriverOrUnit(
                driverUserId, responderType, responderId, now);

        return activeOffers.stream().map(o -> {
            EmergencyRequest emergency = emergencyRepository.findById(o.getEmergencyId()).orElse(null);
            Ambulance unit = ambulanceRepository.findById(o.getResponderId()).orElse(null);
            return toDto(o, emergency, unit);
        }).toList();
    }

    public List<EmergencyOfferDto> getOffersForEmergency(Long emergencyId) {
        List<EmergencyOffer> offers = offerRepository.findByEmergencyIdOrderByOfferedAtDesc(emergencyId);
        return offers.stream().map(o -> {
            EmergencyRequest emergency = emergencyRepository.findById(o.getEmergencyId()).orElse(null);
            Ambulance unit = ambulanceRepository.findById(o.getResponderId()).orElse(null);
            return toDto(o, emergency, unit);
        }).toList();
    }

    public EmergencyOfferDto toDto(EmergencyOffer o, EmergencyRequest e, Ambulance responder) {
        LocalDateTime now = LocalDateTime.now();
        long remaining = o.getExpiresAt() != null && o.getExpiresAt().isAfter(now)
                ? Duration.between(now, o.getExpiresAt()).getSeconds()
                : 0L;

        long elapsed = e != null && e.getCreatedAt() != null
                ? Duration.between(e.getCreatedAt(), now).getSeconds()
                : 0L;

        return EmergencyOfferDto.builder()
                .id(o.getId())
                .emergencyId(o.getEmergencyId())
                .emergencyRequestNumber(e != null ? e.getRequestNumber() : null)
                .emergencyType(e != null ? e.getEmergencyType().name() : null)
                .priority(e != null ? e.getPriority().name() : null)
                .description(e != null ? e.getDescription() : null)
                .citizenName(e != null ? e.getCitizenName() : null)
                .contactNumber(e != null ? e.getContactNumber() : null)
                .latitude(e != null ? e.getLatitude() : null)
                .longitude(e != null ? e.getLongitude() : null)
                .readableAddress(e != null ? e.getReadableAddress() : null)
                .landmark(e != null ? e.getLandmark() : null)
                .affectedPeopleCount(e != null ? e.getAffectedPeopleCount() : null)
                .emergencyCreatedAt(e != null ? e.getCreatedAt() : null)
                .elapsedSeconds(elapsed)
                .responderType(o.getResponderType() != null ? o.getResponderType().name() : null)
                .responderId(o.getResponderId())
                .responderVehicleNumber(responder != null ? responder.getVehicleNumber() : null)
                .distanceKm(o.getDistance())
                .etaMinutes(o.getEstimatedResponseTime())
                .status(o.getStatus().name())
                .offeredAt(o.getOfferedAt())
                .expiresAt(o.getExpiresAt())
                .timeoutSeconds((long) offerTimeoutSeconds)
                .remainingSeconds(remaining)
                .declineReason(o.getDeclineReason())
                .build();
    }

    private Long getDriverUserIdForResponder(Ambulance responder) {
        if (responder.getDriverId() == null) return null;
        return driverRepository.findById(responder.getDriverId())
                .map(Driver::getUserId)
                .orElse(null);
    }

    private void validateResponderAuthorization(EmergencyOffer offer, Long driverUserId) {
        if (driverUserId == null) return;
        if (offer.getDriverUserId() != null && offer.getDriverUserId().equals(driverUserId)) {
            return;
        }
        boolean isLinkedDriver = driverRepository.findByUserId(driverUserId)
                .map(d -> {
                    if (offer.getResponderId() == null) return false;
                    return ambulanceRepository.findById(offer.getResponderId())
                            .map(amb -> d.getId().equals(amb.getDriverId()))
                            .orElse(false);
                })
                .orElse(false);

        if (!isLinkedDriver) {
            throw new com.routewise.exception.UnauthorizedException(
                    "You are not authorized to respond to this emergency offer");
        }
    }
}
