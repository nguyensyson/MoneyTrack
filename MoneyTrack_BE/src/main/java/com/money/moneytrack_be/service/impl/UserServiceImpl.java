package com.money.moneytrack_be.service.impl;

import com.money.moneytrack_be.dto.request.UpdateProfileRequest;
import com.money.moneytrack_be.dto.response.UserProfileResponse;
import com.money.moneytrack_be.entity.User;
import com.money.moneytrack_be.exception.ResourceNotFoundException;
import com.money.moneytrack_be.repository.UserRepository;
import com.money.moneytrack_be.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
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

    @Override
    public UserProfileResponse updateCurrentUser(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        user.setName(request.getName().trim());
        userRepository.save(user);
        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
