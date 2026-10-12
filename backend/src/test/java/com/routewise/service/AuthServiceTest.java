package com.routewise.service;

import com.routewise.dto.LoginRequest;
import com.routewise.dto.RegisterRequest;
import com.routewise.entity.Enums;
import com.routewise.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Test
    void registerAndLoginSucceeds() {
        RegisterRequest register = new RegisterRequest();
        register.setName("Test Citizen");
        register.setEmail("test.citizen@routewise.demo");
        register.setPassword("Password123");
        register.setRole(Enums.Role.CITIZEN);

        var registerResponse = authService.register(register);
        assertNotNull(registerResponse.getToken());
        assertEquals("CITIZEN", registerResponse.getRole());

        LoginRequest login = new LoginRequest();
        login.setEmail("test.citizen@routewise.demo");
        login.setPassword("Password123");

        var loginResponse = authService.login(login);
        assertNotNull(loginResponse.getToken());
    }

    @Test
    void duplicateEmailRegistrationFails() {
        RegisterRequest register = new RegisterRequest();
        register.setName("Dup");
        register.setEmail("dup@routewise.demo");
        register.setPassword("Password123");
        register.setRole(Enums.Role.CITIZEN);
        authService.register(register);

        RegisterRequest duplicate = new RegisterRequest();
        duplicate.setName("Dup2");
        duplicate.setEmail("dup@routewise.demo");
        duplicate.setPassword("Password123");
        duplicate.setRole(Enums.Role.CITIZEN);

        assertThrows(BusinessException.class, () -> authService.register(duplicate));
    }

    @Test
    void loginWithWrongPasswordFails() {
        RegisterRequest register = new RegisterRequest();
        register.setName("WrongPass");
        register.setEmail("wrongpass@routewise.demo");
        register.setPassword("Password123");
        register.setRole(Enums.Role.CITIZEN);
        authService.register(register);

        LoginRequest login = new LoginRequest();
        login.setEmail("wrongpass@routewise.demo");
        login.setPassword("IncorrectPassword");

        assertThrows(BadCredentialsException.class, () -> authService.login(login));
    }
}
