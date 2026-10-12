package com.routewise.controller;

import com.routewise.dto.AmbulanceDto;
import com.routewise.dto.ApiResponse;
import com.routewise.dto.DashboardSummaryDto;
import com.routewise.dto.EmergencyDto;
import com.routewise.service.AmbulanceService;
import com.routewise.service.DashboardService;
import com.routewise.service.EmergencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final EmergencyService emergencyService;
    private final AmbulanceService ambulanceService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> summary() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getSummary()));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> analytics() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getAnalytics()));
    }

    @GetMapping("/active-emergencies")
    public ResponseEntity<ApiResponse<List<EmergencyDto>>> activeEmergencies() {
        return ResponseEntity.ok(ApiResponse.success(emergencyService.getActive()));
    }

    @GetMapping("/ambulances")
    public ResponseEntity<ApiResponse<List<AmbulanceDto>>> ambulances() {
        return ResponseEntity.ok(ApiResponse.success(ambulanceService.getAll()));
    }
}
