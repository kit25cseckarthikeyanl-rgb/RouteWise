package com.routewise.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ambulances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ambulance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_number", nullable = false, unique = true)
    private String vehicleNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "responder_type", nullable = false)
    @Builder.Default
    private Enums.ResponderType responderType = Enums.ResponderType.AMBULANCE;

    @Column(name = "driver_id")
    private Long driverId;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.AmbulanceStatus status = Enums.AmbulanceStatus.AVAILABLE;

    @Column(name = "current_emergency_id")
    private Long currentEmergencyId;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    protected void touch() {
        lastUpdated = LocalDateTime.now();
    }
}
