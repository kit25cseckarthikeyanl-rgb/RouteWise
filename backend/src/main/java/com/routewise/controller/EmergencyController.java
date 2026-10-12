package com.routewise.controller;

import com.routewise.dto.*;
import com.routewise.entity.Enums;
import com.routewise.security.AuthenticatedUser;
import com.routewise.service.EmergencyOfferService;
import com.routewise.service.EmergencyService;
import com.routewise.service.GpsSimulationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emergencies")
@RequiredArgsConstructor
public class EmergencyController {

    private final EmergencyService emergencyService;
    private final EmergencyOfferService emergencyOfferService;
    private final GpsSimulationService gpsSimulationService;

    @PostMapping
    public ResponseEntity<ApiResponse<EmergencyDto>> create(@Valid @RequestBody CreateEmergencyRequest request, Authentication auth) {
        AuthenticatedUser user = (AuthenticatedUser) auth.getPrincipal();
        EmergencyDto dto = emergencyService.createEmergency(user.userId(), request);
        return ResponseEntity.ok(ApiResponse.success("Emergency registered and dispatch initiated", dto));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmergencyDto>>> getAll(Authentication auth) {
        AuthenticatedUser user = (AuthenticatedUser) auth.getPrincipal();
        List<EmergencyDto> result = "CITIZEN".equals(user.role())
                ? emergencyService.getForRequester(user.userId())
                : emergencyService.getAll();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmergencyDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(emergencyService.getById(id)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<EmergencyDto>> updateStatus(@PathVariable Long id,
                                                                    @Valid @RequestBody UpdateStatusRequest request,
                                                                    Authentication auth) {
        AuthenticatedUser user = (AuthenticatedUser) auth.getPrincipal();
        Enums.EmergencyStatus status = Enums.EmergencyStatus.valueOf(request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(emergencyService.updateStatus(id, status, user.userId())));
    }

    @PostMapping("/{id}/dispatch")
    public ResponseEntity<ApiResponse<EmergencyDto>> dispatch(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(emergencyService.dispatch(id)));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<EmergencyDto>> driverAccept(@PathVariable Long id, Authentication auth) {
        AuthenticatedUser user = (AuthenticatedUser) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(emergencyService.driverAccept(id, user.userId())));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<EmergencyDto>> cancel(@PathVariable Long id, Authentication auth) {
        AuthenticatedUser user = (AuthenticatedUser) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(emergencyService.cancelEmergency(id, user.userId())));
    }

    // --- Emergency Offer Endpoints (Section 5 & 6) ---

    @GetMapping("/offers/pending")
    public ResponseEntity<ApiResponse<List<EmergencyOfferDto>>> getMyPendingOffers(
            @RequestParam(required = false, defaultValue = "AMBULANCE") String responderType,
            @RequestParam(required = false) Long responderId,
            Authentication auth) {
        AuthenticatedUser user = (AuthenticatedUser) auth.getPrincipal();
        Enums.ResponderType type = Enums.ResponderType.valueOf(responderType);
        List<EmergencyOfferDto> offers = emergencyOfferService.getActiveOffersForResponder(type, responderId != null ? responderId : 0L, user.userId());
        return ResponseEntity.ok(ApiResponse.success(offers));
    }

    @PostMapping("/offers/{offerId}/accept")
    public ResponseEntity<ApiResponse<EmergencyOfferDto>> acceptOffer(@PathVariable Long offerId, Authentication auth) {
        AuthenticatedUser user = (AuthenticatedUser) auth.getPrincipal();
        EmergencyOfferDto dto = emergencyOfferService.acceptOffer(offerId, user.userId());
        return ResponseEntity.ok(ApiResponse.success("Offer accepted and assignment confirmed", dto));
    }

    @PostMapping("/offers/{offerId}/decline")
    public ResponseEntity<ApiResponse<EmergencyOfferDto>> declineOffer(
            @PathVariable Long offerId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        AuthenticatedUser user = (AuthenticatedUser) auth.getPrincipal();
        String reason = body != null ? body.get("reason") : "Declined by responder";
        EmergencyOfferDto dto = emergencyOfferService.declineOffer(offerId, user.userId(), reason);
        // Automatically attempt reassignment to next eligible responder
        emergencyService.dispatch(dto.getEmergencyId());
        return ResponseEntity.ok(ApiResponse.success("Offer declined. Reassignment triggered.", dto));
    }

    @GetMapping("/{id}/offers")
    public ResponseEntity<ApiResponse<List<EmergencyOfferDto>>> getOffersForEmergency(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(emergencyOfferService.getOffersForEmergency(id)));
    }

    // --- Demo Simulation Endpoints ---

    @PostMapping("/{id}/simulate/{ambulanceId}")
    public ResponseEntity<ApiResponse<String>> startSimulation(@PathVariable Long id, @PathVariable Long ambulanceId) {
        gpsSimulationService.startSimulation(id, ambulanceId);
        return ResponseEntity.ok(ApiResponse.success("DEMO SIMULATION started", "SIMULATING"));
    }

    @PostMapping("/simulate/{ambulanceId}/stop")
    public ResponseEntity<ApiResponse<String>> stopSimulation(@PathVariable Long ambulanceId) {
        gpsSimulationService.stopSimulation(ambulanceId);
        return ResponseEntity.ok(ApiResponse.success("Simulation stopped", "STOPPED"));
    }
}
