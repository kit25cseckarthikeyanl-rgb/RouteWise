package com.routewise.service;

import com.routewise.dto.HospitalDto;
import com.routewise.entity.Enums;
import com.routewise.entity.Hospital;
import com.routewise.exception.ResourceNotFoundException;
import com.routewise.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final AuditService auditService;

    public List<HospitalDto> getAll() {
        return hospitalRepository.findAll().stream().map(this::toDto).toList();
    }

    public HospitalDto getById(Long id) {
        return toDto(getOrThrow(id));
    }

    public HospitalDto create(Hospital hospital) {
        return toDto(hospitalRepository.save(hospital));
    }

    public HospitalDto updateStatus(Long id, Enums.HospitalStatusEnum status, Long actorUserId) {
        Hospital hospital = getOrThrow(id);
        hospital.setStatus(status);
        hospital = hospitalRepository.save(hospital);
        auditService.log(actorUserId, "STATUS_UPDATED", "Hospital", hospital.getId(), "Status -> " + status);
        return toDto(hospital);
    }

    public HospitalDto updateCapacity(Long id, Integer bedsAvailable, Boolean icuAvailable, Long actorUserId) {
        Hospital hospital = getOrThrow(id);
        if (bedsAvailable != null) hospital.setBedsAvailable(bedsAvailable);
        if (icuAvailable != null) hospital.setIcuAvailable(icuAvailable);
        hospital = hospitalRepository.save(hospital);
        auditService.log(actorUserId, "STATUS_UPDATED", "Hospital", hospital.getId(), "Capacity updated");
        return toDto(hospital);
    }

    private Hospital getOrThrow(Long id) {
        return hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + id));
    }

    private HospitalDto toDto(Hospital h) {
        return HospitalDto.builder()
                .id(h.getId())
                .name(h.getName())
                .address(h.getAddress())
                .latitude(h.getLatitude())
                .longitude(h.getLongitude())
                .emergencyCapability(h.getEmergencyCapability())
                .icuAvailable(h.getIcuAvailable())
                .bedsAvailable(h.getBedsAvailable())
                .status(h.getStatus().name())
                .build();
    }
}
