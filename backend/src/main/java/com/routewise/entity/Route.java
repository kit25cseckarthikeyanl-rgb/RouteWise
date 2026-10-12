package com.routewise.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "routes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "emergency_id", nullable = false)
    private Long emergencyId;

    @Column(name = "ambulance_id", nullable = false)
    private Long ambulanceId;

    @Column(name = "source_latitude", nullable = false)
    private Double sourceLatitude;

    @Column(name = "source_longitude", nullable = false)
    private Double sourceLongitude;

    @Column(name = "destination_latitude", nullable = false)
    private Double destinationLatitude;

    @Column(name = "destination_longitude", nullable = false)
    private Double destinationLongitude;

    @Column(nullable = false)
    private Double distance;

    @Column(name = "estimated_time", nullable = false)
    private Double estimatedTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Enums.RouteAlgorithm algorithm;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
