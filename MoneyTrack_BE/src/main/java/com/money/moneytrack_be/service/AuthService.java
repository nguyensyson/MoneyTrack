package com.money.moneytrack_be.service;

import com.money.moneytrack_be.dto.response.AuthResponse;
import com.money.moneytrack_be.entity.Role;
import com.money.moneytrack_be.entity.User;
import com.money.moneytrack_be.enums.RoleName;
import com.money.moneytrack_be.exception.BadRequestException;
import com.money.moneytrack_be.repository.RoleRepository;
import com.money.moneytrack_be.repository.UserRepository;
import com.money.moneytrack_be.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RoleRepository roleRepository;

    private Role findOrCreateRole(RoleName roleName) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(null, roleName)));
    }

    public void register(String email, String password, String name) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new BadRequestException("Email already in use: " + email);
        }
        Role userRole = findOrCreateRole(RoleName.USER);
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .name(name)
                .roles(Set.of(userRole))
                .build();
        userRepository.save(user);
    }

    public void registerAdmin(String email, String password, String name) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new BadRequestException("Email already in use: " + email);
        }
        Role adminRole = findOrCreateRole(RoleName.ADMIN);
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .name(name)
                .roles(Set.of(adminRole))
                .build();
        userRepository.save(user);
    }

    public AuthResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        String token = jwtUtil.generateToken(email);
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());
        return new AuthResponse(token, roles);
    }
}
