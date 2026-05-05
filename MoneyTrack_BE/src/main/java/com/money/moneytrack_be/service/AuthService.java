package com.money.moneytrack_be.service;

import com.money.moneytrack_be.dto.response.AuthResponse;

public interface AuthService {

    void register(String email, String password, String name);
    void registerAdmin(String email, String password, String name);
    AuthResponse login(String email, String password);
}
