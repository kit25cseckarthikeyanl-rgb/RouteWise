package com.routewise.security;

public record AuthenticatedUser(Long userId, String email, String role) {
}
