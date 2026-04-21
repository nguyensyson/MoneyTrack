package com.money.moneytrack_be.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserProfileResponse {

    private Long id;
    private String name;
    private String email;
    private LocalDateTime createdAt;
}
