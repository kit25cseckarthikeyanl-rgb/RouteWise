package com.routewise.service;

import com.routewise.algorithm.AStarAlgorithm;
import com.routewise.dto.RankedHospitalDto;
import com.routewise.entity.Enums;
import com.routewise.entity.Hospital;
import com.routewise.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Ranks hospitals for a given pickup point using ETA, distance, emergency
 * capability, availability, bed capacity and ICU availability.
 * Hospitals with no emergency capability or that are FULL/OFFLINE are
 * still scored but ranked last (never silently dropped, so the reasoning
 * stays auditable).
 */
@Service
@RequiredArgsConstructor
public class HospitalSelectionService {

    private final HospitalRepository hospitalRepository;

    private static final double AVERAGE_CITY_SPEED_KM_PER_MIN = 0.5;

    public List<RankedHospitalDto> rankHospitals(double fromLat, double fromLon) {
        List<Hospital> hospitals = hospitalRepository.findAll();

        return hospitals.stream().map(h -> {
            double distanceKm = AStarAlgorithm.haversineKm(fromLat, fromLon, h.getLatitude(), h.getLongitude());
            double etaMin = distanceKm / AVERAGE_CITY_SPEED_KM_PER_MIN;

            double score = etaMin;
            if (!Boolean.TRUE.equals(h.getEmergencyCapability())) score += 100;
            if (h.getStatus() == Enums.HospitalStatusEnum.FULL) score += 80;
            if (h.getStatus() == Enums.HospitalStatusEnum.OFFLINE) score += 200;
            if (h.getStatus() == Enums.HospitalStatusEnum.BUSY) score += 15;
            if (!Boolean.TRUE.equals(h.getIcuAvailable())) score += 10;
            if (h.getBedsAvailable() != null && h.getBedsAvailable() <= 0) score += 20;

            String reason = buildReason(h, distanceKm, etaMin);

            return RankedHospitalDto.builder()
                    .hospitalId(h.getId())
                    .name(h.getName())
                    .distanceKm(round2(distanceKm))
                    .etaMinutes(round2(etaMin))
                    .emergencyCapability(Boolean.TRUE.equals(h.getEmergencyCapability()))
                    .icuAvailable(Boolean.TRUE.equals(h.getIcuAvailable()))
                    .bedsAvailable(h.getBedsAvailable() == null ? 0 : h.getBedsAvailable())
                    .score(round2(score))
                    .selectionReason(reason)
                    .build();
        }).sorted(Comparator.comparingDouble(RankedHospitalDto::getScore))
          .collect(Collectors.toList());
    }

    private String buildReason(Hospital h, double distanceKm, double etaMin) {
        return String.format(
                "Ranked by ETA (~%.1f min, %.1f km), emergency capability (%s), status (%s), "
                + "ICU availability (%s) and %d available beds.",
                etaMin, distanceKm,
                Boolean.TRUE.equals(h.getEmergencyCapability()) ? "available" : "unavailable",
                h.getStatus(),
                Boolean.TRUE.equals(h.getIcuAvailable()) ? "available" : "unavailable",
                h.getBedsAvailable() == null ? 0 : h.getBedsAvailable());
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
