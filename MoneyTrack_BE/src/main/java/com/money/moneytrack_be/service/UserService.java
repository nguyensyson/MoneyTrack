package com.money.moneytrack_be.service;

import com.money.moneytrack_be.dto.response.UserProfileResponse;
import com.money.moneytrack_be.entity.User;
import com.money.moneytrack_be.exception.ResourceNotFoundException;
import com.money.moneytrack_be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserProfileResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
