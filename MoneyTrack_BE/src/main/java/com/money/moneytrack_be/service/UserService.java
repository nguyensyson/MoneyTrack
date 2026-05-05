package com.money.moneytrack_be.service;

import com.money.moneytrack_be.dto.request.UpdateProfileRequest;
import com.money.moneytrack_be.dto.response.UserProfileResponse;

public interface UserService {

    UserProfileResponse getCurrentUser(String email);

    UserProfileResponse updateCurrentUser(String email, UpdateProfileRequest request);
}
