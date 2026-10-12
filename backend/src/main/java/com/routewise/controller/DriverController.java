package com.routewise.controller;

import com.routewise.dto.ApiResponse;
import com.routewise.entity.Driver;
import com.routewise.entity.EmergencyAssignment;
import com.routewise.repository.AmbulanceRepository;
import com.routewise.repository.DriverRepository;
import com.routewise.repository.EmergencyAssignmentRepository;
import com.routewise.exception.ResourceNotFoundException;
import com.routewise.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverRepository driverRepository;
    private final AmbulanceRepository ambulanceRepository;
    private final EmergencyAssignmentRepository assignmentRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Driver>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(driverRepository.findAll()));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Driver>> getMyProfile(Authentication auth) {
        AuthenticatedUser user = (AuthenticatedUser) auth.getPrincipal();
        Driver driver = driverRepository.findByUserId(user.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found for current user"));
        return ResponseEntity.ok(ApiResponse.success(driver));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Driver>> getById(@PathVariable Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found: " + id));
        return ResponseEntity.ok(ApiResponse.success(driver));
    }

    @GetMapping("/{id}/assignments")
    public ResponseEntity<ApiResponse<List<EmergencyAssignment>>> getAssignments(@PathVariable Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found: " + id));
        Long ambulanceId = ambulanceRepository.findByDriverId(driver.getId()).map(a -> a.getId()).orElse(null);
        List<EmergencyAssignment> assignments = ambulanceId != null
                ? assignmentRepository.findByAmbulanceId(ambulanceId)
                : List.of();
        return ResponseEntity.ok(ApiResponse.success(assignments));
    }
}
