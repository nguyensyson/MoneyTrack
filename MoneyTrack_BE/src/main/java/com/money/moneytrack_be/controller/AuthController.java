package com.money.moneytrack_be.controller;

import com.money.moneytrack_be.dto.request.LoginRequest;
import com.money.moneytrack_be.dto.request.RegisterRequest;
import com.money.moneytrack_be.dto.response.AuthResponse;
import com.money.moneytrack_be.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request.getEmail(), request.getPassword(), request.getName());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/register-admin")
    public ResponseEntity<Void> registerAdmin(@Valid @RequestBody RegisterRequest request) {
        authService.registerAdmin(request.getEmail(), request.getPassword(), request.getName());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(response);
    }
}
