package com.routewise.repository;

import com.routewise.entity.EmergencyAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmergencyAssignmentRepository extends JpaRepository<EmergencyAssignment, Long> {
    List<EmergencyAssignment> findByEmergencyId(Long emergencyId);
    List<EmergencyAssignment> findByAmbulanceId(Long ambulanceId);
    Optional<EmergencyAssignment> findTopByEmergencyIdOrderByAssignedAtDesc(Long emergencyId);
}
