package com.routewise.controller;

import com.routewise.dto.ApiResponse;
import com.routewise.dto.EmergencyDto;
import com.routewise.dto.RankedAmbulanceDto;
import com.routewise.service.EmergencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dispatch")
@RequiredArgsConstructor
public class DispatchController {

    private final EmergencyService emergencyService;

    @PostMapping("/{emergencyId}/rank")
    public ResponseEntity<ApiResponse<List<RankedAmbulanceDto>>> rank(@PathVariable Long emergencyId) {
        return ResponseEntity.ok(ApiResponse.success(emergencyService.rankForEmergency(emergencyId)));
    }

    @PostMapping("/{emergencyId}/assign")
    public ResponseEntity<ApiResponse<EmergencyDto>> assign(@PathVariable Long emergencyId) {
        return ResponseEntity.ok(ApiResponse.success(emergencyService.dispatch(emergencyId)));
    }
}
