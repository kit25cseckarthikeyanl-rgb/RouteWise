package com.routewise.repository;

import com.routewise.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RouteRepository extends JpaRepository<Route, Long> {
    List<Route> findByEmergencyId(Long emergencyId);
}
