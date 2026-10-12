package com.routewise.config;

import com.routewise.entity.*;
import com.routewise.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the database with fictional demo data on first startup, ONLY if the
 * users table is empty. All data below is synthetic/fictional and intended
 * strictly for demonstration.
 */
@Component
@RequiredArgsConstructor
public class DemoDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final AmbulanceRepository ambulanceRepository;
    private final HospitalRepository hospitalRepository;
    private final EmergencyRequestRepository emergencyRequestRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${routewise.demo.password}")
    private String demoPassword;

    // Reference point: demo center coordinates (fictional/simulated)
    private static final double BASE_LAT = 11.1085; // Tiruppur test center reference
    private static final double BASE_LON = 77.3411;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return; // already seeded
        }

        String hash = passwordEncoder.encode(demoPassword);

        User admin = save(User.builder().name("System Admin").email("admin@routewise.demo")
                .passwordHash(hash).phone("+91-9000000001").role(Enums.Role.ADMIN).status(Enums.UserStatus.ACTIVE).build());

        User citizen = save(User.builder().name("Demo Citizen").email("citizen@routewise.demo")
                .passwordHash(hash).phone("+91-9000000002").role(Enums.Role.CITIZEN).status(Enums.UserStatus.ACTIVE).build());

        User hospitalUser = save(User.builder().name("Hospital Coordinator").email("hospital1@routewise.demo")
                .passwordHash(hash).phone("+91-9000000003").role(Enums.Role.HOSPITAL).status(Enums.UserStatus.ACTIVE).build());

        // 1. Ambulances: 5 medical drivers + 5 ambulances
        for (int i = 1; i <= 5; i++) {
            User driverUser = save(User.builder().name("Ambulance Driver " + i).email("driver" + i + "@routewise.demo")
                    .passwordHash(hash).phone("+91-900000001" + i).role(Enums.Role.DRIVER).status(Enums.UserStatus.ACTIVE).build());

            Driver driver = save(Driver.builder().userId(driverUser.getId())
                    .licenseNumber("DL-AMB-" + (1000 + i))
                    .status(Enums.AmbulanceStatus.AVAILABLE)
                    .currentLatitude(BASE_LAT + jitter(i))
                    .currentLongitude(BASE_LON + jitter(i + 10))
                    .build());

            Ambulance ambulance = save(Ambulance.builder()
                    .vehicleNumber("AMB-" + (100 + i))
                    .responderType(Enums.ResponderType.AMBULANCE)
                    .driverId(driver.getId())
                    .latitude(BASE_LAT + jitter(i))
                    .longitude(BASE_LON + jitter(i + 10))
                    .status(Enums.AmbulanceStatus.AVAILABLE)
                    .build());

            driver.setAmbulanceId(ambulance.getId());
            driverRepository.save(driver);
        }

        // 2. Police: 2 police officers + 2 patrol units
        for (int i = 1; i <= 2; i++) {
            User policeUser = save(User.builder().name("Police Officer " + i).email("police" + i + "@routewise.demo")
                    .passwordHash(hash).phone("+91-900000002" + i).role(Enums.Role.POLICE).status(Enums.UserStatus.ACTIVE).build());

            Driver driver = save(Driver.builder().userId(policeUser.getId())
                    .licenseNumber("DL-POL-" + (2000 + i))
                    .status(Enums.AmbulanceStatus.AVAILABLE)
                    .currentLatitude(BASE_LAT + jitter(i + 20))
                    .currentLongitude(BASE_LON + jitter(i + 25))
                    .build());

            Ambulance policeUnit = save(Ambulance.builder()
                    .vehicleNumber("POL-" + (100 + i))
                    .responderType(Enums.ResponderType.POLICE)
                    .driverId(driver.getId())
                    .latitude(BASE_LAT + jitter(i + 20))
                    .longitude(BASE_LON + jitter(i + 25))
                    .status(Enums.AmbulanceStatus.AVAILABLE)
                    .build());

            driver.setAmbulanceId(policeUnit.getId());
            driverRepository.save(driver);
        }

        // 3. Fire: 2 fire drivers + 2 fire engines
        for (int i = 1; i <= 2; i++) {
            User fireUser = save(User.builder().name("Fire Commander " + i).email("fire" + i + "@routewise.demo")
                    .passwordHash(hash).phone("+91-900000003" + i).role(Enums.Role.FIRE_DRIVER).status(Enums.UserStatus.ACTIVE).build());

            Driver driver = save(Driver.builder().userId(fireUser.getId())
                    .licenseNumber("DL-FE-" + (3000 + i))
                    .status(Enums.AmbulanceStatus.AVAILABLE)
                    .currentLatitude(BASE_LAT + jitter(i + 30))
                    .currentLongitude(BASE_LON + jitter(i + 35))
                    .build());

            Ambulance fireUnit = save(Ambulance.builder()
                    .vehicleNumber("FIRE-" + (100 + i))
                    .responderType(Enums.ResponderType.FIRE_ENGINE)
                    .driverId(driver.getId())
                    .latitude(BASE_LAT + jitter(i + 30))
                    .longitude(BASE_LON + jitter(i + 35))
                    .status(Enums.AmbulanceStatus.AVAILABLE)
                    .build());

            driver.setAmbulanceId(fireUnit.getId());
            driverRepository.save(driver);
        }

        // 3 fictional hospitals
        save(Hospital.builder().name("City Care Hospital").address("12 Wellness Ave (demo)")
                .latitude(BASE_LAT + 0.01).longitude(BASE_LON + 0.01)
                .emergencyCapability(true).icuAvailable(true).bedsAvailable(18)
                .status(Enums.HospitalStatusEnum.AVAILABLE).build());

        save(Hospital.builder().name("Riverside General Hospital").address("45 Riverside Rd (demo)")
                .latitude(BASE_LAT - 0.015).longitude(BASE_LON + 0.008)
                .emergencyCapability(true).icuAvailable(false).bedsAvailable(6)
                .status(Enums.HospitalStatusEnum.BUSY).build());

        save(Hospital.builder().name("Northside Medical Center").address("78 North Blvd (demo)")
                .latitude(BASE_LAT + 0.02).longitude(BASE_LON - 0.012)
                .emergencyCapability(true).icuAvailable(true).bedsAvailable(0)
                .status(Enums.HospitalStatusEnum.FULL).build());

        // Sample historical emergency records
        Enums.EmergencyType[] types = Enums.EmergencyType.values();
        Enums.Priority[] priorities = Enums.Priority.values();
        for (int i = 1; i <= 6; i++) {
            EmergencyRequest req = EmergencyRequest.builder()
                    .requestNumber(String.format("RW-2026-%06d", i))
                    .requesterId(citizen.getId())
                    .citizenName("Citizen " + i)
                    .contactNumber("+91-984011223" + i)
                    .emergencyType(types[i % types.length])
                    .priority(priorities[i % priorities.length])
                    .description("Historical demo emergency #" + i)
                    .latitude(BASE_LAT + jitter(i))
                    .longitude(BASE_LON + jitter(i + 3))
                    .readableAddress("Sector " + i + " Corridor, Tiruppur")
                    .status(i <= 4 ? Enums.EmergencyStatus.COMPLETED : Enums.EmergencyStatus.CANCELLED)
                    .build();
            emergencyRequestRepository.save(req);
        }
    }

    private double jitter(int seed) {
        return Math.sin(seed * 1.91) * 0.02;
    }

    private User save(User u) { return userRepository.save(u); }
    private Driver save(Driver d) { return driverRepository.save(d); }
    private Ambulance save(Ambulance a) { return ambulanceRepository.save(a); }
    private Hospital save(Hospital h) { return hospitalRepository.save(h); }
}
