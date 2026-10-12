package com.routewise.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_offers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "emergency_id", nullable = false)
    private Long emergencyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "responder_type", nullable = false)
    @Builder.Default
    private Enums.ResponderType responderType = Enums.ResponderType.AMBULANCE;

    @Column(name = "responder_id", nullable = false)
    private Long responderId;

    @Column(name = "driver_user_id")
    private Long driverUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.OfferStatus status = Enums.OfferStatus.PENDING;

    @Column(name = "offered_at", nullable = false)
    private LocalDateTime offeredAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "decline_reason")
    private String declineReason;

    private Double score;

    private Double distance;

    @Column(name = "estimated_response_time")
    private Double estimatedResponseTime;

    @Version
    @Column(nullable = false)
    private Long version;

    @PrePersist
    protected void onCreate() {
        if (offeredAt == null) {
            offeredAt = LocalDateTime.now();
        }
    }
}
