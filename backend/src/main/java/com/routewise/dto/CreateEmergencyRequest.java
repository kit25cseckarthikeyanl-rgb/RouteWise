package com.routewise.dto;

import com.routewise.entity.Enums;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateEmergencyRequest {
    @NotNull
    private Enums.EmergencyType emergencyType;

    @NotNull
    private Enums.Priority priority;

    private String description;

    private String citizenName;

    private String contactNumber;

    @NotNull @DecimalMin("-90.0") @DecimalMax("90.0")
    private Double latitude;

    @NotNull @DecimalMin("-180.0") @DecimalMax("180.0")
    private Double longitude;

    private String readableAddress;

    private String landmark;

    private Integer affectedPeopleCount;
}
