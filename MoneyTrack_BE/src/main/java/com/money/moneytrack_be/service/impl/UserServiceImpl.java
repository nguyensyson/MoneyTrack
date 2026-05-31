package com.money.moneytrack_be.service.impl;

import com.money.moneytrack_be.dto.request.UpdateProfileRequest;
import com.money.moneytrack_be.dto.response.UserProfileResponse;
import com.money.moneytrack_be.entity.UserItem;
import com.money.moneytrack_be.exception.ResourceNotFoundException;
import com.money.moneytrack_be.repository.UserDynamoRepository;
import com.money.moneytrack_be.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserDynamoRepository userRepository;

    @Override
    public UserProfileResponse getCurrentUser(String email) {
        UserItem user = getUser(email);
        return toResponse(user);
    }

    @Override
    public UserProfileResponse updateCurrentUser(String email, UpdateProfileRequest request) {
        UserItem user = getUser(email);
        user.setName(request.getName().trim());
        user.setUpdatedAt(Instant.now().toString());
        userRepository.save(user);
        return toResponse(user);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private UserItem getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private UserProfileResponse toResponse(UserItem user) {
        return UserProfileResponse.builder()
                .id(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
