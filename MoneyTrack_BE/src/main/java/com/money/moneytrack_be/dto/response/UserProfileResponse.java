package com.money.moneytrack_be.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserProfileResponse {

    private String id;
    private String name;
    private String email;
    private String createdAt;
}
