package com.routewise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class HospitalDto {
    private Long id;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private Boolean emergencyCapability;
    private Boolean icuAvailable;
    private Integer bedsAvailable;
    private String status;
}
