package com.routewise.repository;

import com.routewise.entity.Ambulance;
import com.routewise.entity.Enums;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AmbulanceRepository extends JpaRepository<Ambulance, Long> {
    List<Ambulance> findByStatus(Enums.AmbulanceStatus status);
    List<Ambulance> findByResponderTypeAndStatus(Enums.ResponderType responderType, Enums.AmbulanceStatus status);
    List<Ambulance> findByResponderType(Enums.ResponderType responderType);
    Optional<Ambulance> findByVehicleNumber(String vehicleNumber);
    Optional<Ambulance> findByDriverId(Long driverId);
}
