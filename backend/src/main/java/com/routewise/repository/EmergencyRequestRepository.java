package com.routewise.repository;

import com.routewise.entity.EmergencyRequest;
import com.routewise.entity.Enums;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmergencyRequestRepository extends JpaRepository<EmergencyRequest, Long> {
    Optional<EmergencyRequest> findByRequestNumber(String requestNumber);
    List<EmergencyRequest> findByRequesterId(Long requesterId);
    List<EmergencyRequest> findByStatus(Enums.EmergencyStatus status);
    List<EmergencyRequest> findByStatusIn(List<Enums.EmergencyStatus> statuses);
    long countByStatus(Enums.EmergencyStatus status);
    long countByPriority(Enums.Priority priority);
}
