package com.routewise.repository;

import com.routewise.entity.EmergencyOffer;
import com.routewise.entity.Enums;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmergencyOfferRepository extends JpaRepository<EmergencyOffer, Long> {

    List<EmergencyOffer> findByEmergencyId(Long emergencyId);

    List<EmergencyOffer> findByEmergencyIdOrderByOfferedAtDesc(Long emergencyId);

    Optional<EmergencyOffer> findTopByEmergencyIdOrderByOfferedAtDesc(Long emergencyId);

    List<EmergencyOffer> findByStatusAndExpiresAtBefore(Enums.OfferStatus status, LocalDateTime time);

    List<EmergencyOffer> findByResponderTypeAndResponderId(Enums.ResponderType responderType, Long responderId);

    @Query("SELECT o FROM EmergencyOffer o WHERE o.responderType = :responderType AND o.responderId = :responderId " +
           "AND o.status = com.routewise.entity.Enums.OfferStatus.PENDING AND o.expiresAt > :now ORDER BY o.offeredAt DESC")
    List<EmergencyOffer> findActivePendingOffersForResponder(
            @Param("responderType") Enums.ResponderType responderType,
            @Param("responderId") Long responderId,
            @Param("now") LocalDateTime now);

    @Query("SELECT o FROM EmergencyOffer o WHERE (o.driverUserId = :driverUserId OR " +
           "(o.responderType = :responderType AND o.responderId = :responderId)) " +
           "AND o.status = com.routewise.entity.Enums.OfferStatus.PENDING AND o.expiresAt > :now ORDER BY o.offeredAt DESC")
    List<EmergencyOffer> findActivePendingOffersForDriverOrUnit(
            @Param("driverUserId") Long driverUserId,
            @Param("responderType") Enums.ResponderType responderType,
            @Param("responderId") Long responderId,
            @Param("now") LocalDateTime now);

    @Query("SELECT DISTINCT o.responderId FROM EmergencyOffer o WHERE o.emergencyId = :emergencyId " +
           "AND o.responderType = :responderType AND o.status IN (com.routewise.entity.Enums.OfferStatus.DECLINED, com.routewise.entity.Enums.OfferStatus.EXPIRED)")
    List<Long> findExcludedResponderIdsForEmergency(
            @Param("emergencyId") Long emergencyId,
            @Param("responderType") Enums.ResponderType responderType);
}
