package com.routewise.service;

import com.routewise.dto.DashboardSummaryDto;
import com.routewise.entity.Enums;
import com.routewise.repository.AmbulanceRepository;
import com.routewise.repository.EmergencyRequestRepository;
import com.routewise.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AmbulanceRepository ambulanceRepository;
    private final EmergencyRequestRepository emergencyRequestRepository;
    private final HospitalRepository hospitalRepository;

    public DashboardSummaryDto getSummary() {
        long totalAmbulances = ambulanceRepository.count();
        long available = ambulanceRepository.findByStatus(Enums.AmbulanceStatus.AVAILABLE).size();
        long offline = ambulanceRepository.findByStatus(Enums.AmbulanceStatus.OFFLINE).size();
        long busy = totalAmbulances - available - offline;

        List<Enums.EmergencyStatus> activeStatuses = List.of(
                Enums.EmergencyStatus.CREATED, Enums.EmergencyStatus.SEARCHING_RESOURCE,
                Enums.EmergencyStatus.ASSIGNED, Enums.EmergencyStatus.ACCEPTED,
                Enums.EmergencyStatus.EN_ROUTE_TO_PATIENT, Enums.EmergencyStatus.PATIENT_PICKED_UP,
                Enums.EmergencyStatus.EN_ROUTE_TO_HOSPITAL, Enums.EmergencyStatus.ARRIVED_AT_HOSPITAL);
        long activeEmergencies = emergencyRequestRepository.findByStatusIn(activeStatuses).size();
        long criticalEmergencies = emergencyRequestRepository.countByPriority(Enums.Priority.CRITICAL);

        long hospitalsAvailable = hospitalRepository.findAll().stream()
                .filter(h -> h.getStatus() == Enums.HospitalStatusEnum.AVAILABLE)
                .count();

        long completedToday = emergencyRequestRepository.findByStatus(Enums.EmergencyStatus.COMPLETED).stream()
                .filter(e -> e.getUpdatedAt() != null && e.getUpdatedAt().toLocalDate().equals(LocalDate.now()))
                .count();

        return DashboardSummaryDto.builder()
                .totalAmbulances(totalAmbulances)
                .availableAmbulances(available)
                .busyAmbulances(busy)
                .offlineAmbulances(offline)
                .activeEmergencies(activeEmergencies)
                .criticalEmergencies(criticalEmergencies)
                .hospitalsAvailable(hospitalsAvailable)
                .completedToday(completedToday)
                .build();
    }

    public Map<String, Object> getAnalytics() {
        Map<String, Long> byType = new java.util.HashMap<>();
        Map<String, Long> byPriority = new java.util.HashMap<>();

        emergencyRequestRepository.findAll().forEach(e -> {
            byType.merge(e.getEmergencyType().name(), 1L, Long::sum);
            byPriority.merge(e.getPriority().name(), 1L, Long::sum);
        });

        long completed = emergencyRequestRepository.countByStatus(Enums.EmergencyStatus.COMPLETED);
        long cancelled = emergencyRequestRepository.countByStatus(Enums.EmergencyStatus.CANCELLED);

        return Map.of(
                "emergenciesByType", byType,
                "emergenciesByPriority", byPriority,
                "completedCount", completed,
                "cancelledCount", cancelled
        );
    }
}
