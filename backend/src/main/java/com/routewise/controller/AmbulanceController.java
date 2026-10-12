package com.routewise.controller;

import com.routewise.dto.AmbulanceDto;
import com.routewise.dto.ApiResponse;
import com.routewise.dto.LocationUpdateRequest;
import com.routewise.dto.UpdateStatusRequest;
import com.routewise.entity.Enums;
import com.routewise.security.AuthenticatedUser;
import com.routewise.service.AmbulanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ambulances")
@RequiredArgsConstructor
public class AmbulanceController {

    private final AmbulanceService ambulanceService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AmbulanceDto>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(ambulanceService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AmbulanceDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(ambulanceService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AmbulanceDto>> create(@RequestBody Map<String, Object> body) {
        String vehicleNumber = (String) body.get("vehicleNumber");
        double lat = ((Number) body.get("latitude")).doubleValue();
        double lon = ((Number) body.get("longitude")).doubleValue();
        return ResponseEntity.ok(ApiResponse.success(ambulanceService.create(vehicleNumber, lat, lon)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AmbulanceDto>> updateStatus(@PathVariable Long id,
                                                                     @Valid @RequestBody UpdateStatusRequest request,
                                                                     Authentication auth) {
        AuthenticatedUser user = (AuthenticatedUser) auth.getPrincipal();
        Enums.AmbulanceStatus status = Enums.AmbulanceStatus.valueOf(request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(ambulanceService.updateStatus(id, status, user.userId())));
    }

    @PutMapping("/{id}/location")
    public ResponseEntity<ApiResponse<AmbulanceDto>> updateLocation(@PathVariable Long id,
                                                                       @Valid @RequestBody LocationUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                ambulanceService.updateLocation(id, request.getLatitude(), request.getLongitude())));
    }
}
