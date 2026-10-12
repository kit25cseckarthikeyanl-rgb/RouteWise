package com.routewise.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hospitals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "emergency_capability", nullable = false)
    @Builder.Default
    private Boolean emergencyCapability = true;

    @Column(name = "icu_available", nullable = false)
    @Builder.Default
    private Boolean icuAvailable = true;

    @Column(name = "beds_available", nullable = false)
    @Builder.Default
    private Integer bedsAvailable = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.HospitalStatusEnum status = Enums.HospitalStatusEnum.AVAILABLE;
}
