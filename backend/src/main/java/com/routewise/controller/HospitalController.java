package com.routewise.controller;

import com.routewise.dto.ApiResponse;
import com.routewise.dto.HospitalDto;
import com.routewise.dto.UpdateStatusRequest;
import com.routewise.entity.Enums;
import com.routewise.entity.Hospital;
import com.routewise.security.AuthenticatedUser;
import com.routewise.service.HospitalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
public class HospitalController {

    private final HospitalService hospitalService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<HospitalDto>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(hospitalService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HospitalDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(hospitalService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HospitalDto>> create(@RequestBody Map<String, Object> body) {
        Hospital hospital = Hospital.builder()
                .name((String) body.get("name"))
                .address((String) body.get("address"))
                .latitude(((Number) body.get("latitude")).doubleValue())
                .longitude(((Number) body.get("longitude")).doubleValue())
                .bedsAvailable(body.get("bedsAvailable") != null ? ((Number) body.get("bedsAvailable")).intValue() : 0)
                .icuAvailable(body.get("icuAvailable") != null && (Boolean) body.get("icuAvailable"))
                .emergencyCapability(body.get("emergencyCapability") == null || (Boolean) body.get("emergencyCapability"))
                .status(Enums.HospitalStatusEnum.AVAILABLE)
                .build();
        return ResponseEntity.ok(ApiResponse.success(hospitalService.create(hospital)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<HospitalDto>> updateStatus(@PathVariable Long id,
                                                                    @Valid @RequestBody UpdateStatusRequest request,
                                                                    Authentication auth) {
        AuthenticatedUser user = (AuthenticatedUser) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                hospitalService.updateStatus(id, Enums.HospitalStatusEnum.valueOf(request.getStatus()), user.userId())));
    }

    @PutMapping("/{id}/capacity")
    public ResponseEntity<ApiResponse<HospitalDto>> updateCapacity(@PathVariable Long id,
                                                                      @RequestBody Map<String, Object> body,
                                                                      Authentication auth) {
        AuthenticatedUser user = (AuthenticatedUser) auth.getPrincipal();
        Integer beds = body.get("bedsAvailable") != null ? ((Number) body.get("bedsAvailable")).intValue() : null;
        Boolean icu = body.get("icuAvailable") != null ? (Boolean) body.get("icuAvailable") : null;
        return ResponseEntity.ok(ApiResponse.success(hospitalService.updateCapacity(id, beds, icu, user.userId())));
    }
}
