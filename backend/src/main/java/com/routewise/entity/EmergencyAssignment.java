package com.routewise.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "emergency_id", nullable = false)
    private Long emergencyId;

    @Column(name = "ambulance_id", nullable = false)
    private Long ambulanceId;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "assignment_score", nullable = false)
    private Double assignmentScore;

    @Column(name = "estimated_response_time", nullable = false)
    private Double estimatedResponseTime;

    @Column(nullable = false)
    private Double distance;

    @Column(length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.AssignmentStatus status = Enums.AssignmentStatus.PENDING;

    @PrePersist
    protected void onCreate() {
        assignedAt = LocalDateTime.now();
    }
}
