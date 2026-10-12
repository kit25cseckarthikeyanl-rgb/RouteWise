package com.routewise.service;

import com.routewise.dto.AuthResponse;
import com.routewise.dto.LoginRequest;
import com.routewise.dto.RegisterRequest;
import com.routewise.entity.Driver;
import com.routewise.entity.Enums;
import com.routewise.entity.User;
import com.routewise.exception.BusinessException;
import com.routewise.repository.DriverRepository;
import com.routewise.repository.UserRepository;
import com.routewise.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email is already registered", "EMAIL_TAKEN");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole())
                .status(Enums.UserStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        // Drivers get a demo driver profile automatically so they can be dispatched
        if (user.getRole() == Enums.Role.DRIVER) {
            Driver driver = Driver.builder()
                    .userId(user.getId())
                    .licenseNumber("DL-DEMO-" + user.getId())
                    .status(Enums.AmbulanceStatus.OFFLINE)
                    .build();
            driverRepository.save(driver);
        }

        auditService.log(user.getId(), "USER_REGISTERED", "User", user.getId(), "New " + user.getRole() + " account created");

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (user.getStatus() != Enums.UserStatus.ACTIVE) {
            throw new BusinessException("Account is not active", "ACCOUNT_INACTIVE");
        }

        auditService.log(user.getId(), "USER_LOGIN", "User", user.getId(), "Login successful");

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
