package com.money.moneytrack_be.service.impl;

import com.money.moneytrack_be.dto.response.AuthResponse;
import com.money.moneytrack_be.entity.UserItem;
import com.money.moneytrack_be.enums.RoleName;
import com.money.moneytrack_be.exception.BadRequestException;
import com.money.moneytrack_be.repository.UserDynamoRepository;
import com.money.moneytrack_be.security.JwtUtil;
import com.money.moneytrack_be.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserDynamoRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public void register(String email, String password, String name) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new BadRequestException("Email already in use: " + email);
        }
        UserItem user = buildUser(email, password, name, Set.of(RoleName.USER.name()));
        userRepository.save(user);
    }

    @Override
    public void registerAdmin(String email, String password, String name) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new BadRequestException("Email already in use: " + email);
        }
        UserItem user = buildUser(email, password, name, Set.of(RoleName.ADMIN.name()));
        userRepository.save(user);
    }

    @Override
    public AuthResponse login(String email, String password) {
        UserItem user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        String token = jwtUtil.generateToken(email);
        List<String> roles = user.getRoles().stream().sorted().collect(Collectors.toList());
        return new AuthResponse(token, roles);
    }

    private UserItem buildUser(String email, String password, String name, Set<String> roles) {
        String now = Instant.now().toString();
        return UserItem.builder()
                .userId(UUID.randomUUID().toString())
                .email(email)
                .password(passwordEncoder.encode(password))
                .name(name)
                .roles(roles)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }
}
